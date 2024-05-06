import { isObject, isShallowEqual } from './utils';

type GetDependants = (...args: any[]) => any[];

type Clear = () => void;

type EnhancedSelector = {
	getDependants: GetDependants;
	clear: Clear;
};

/**
 * Internal cache entry.
 */
type CacheNode = {
	/**
	 * Previous node.
	 */
	prev?: CacheNode;

	/**
	 * Next node.
	 */
	next?: CacheNode;

	/**
	 * Function arguments for cache entry.
	 */
	args: unknown[];

	/**
	 * Function result.
	 */
	val: unknown;
};

/**
 * A cache object.
 */
type Cache = {
	/**
	 * Function to clear cache.
	 */
	clear: Clear;

	/**
	 * Whether dependants are valid in considering cache uniqueness.
	 * A cache is unique if dependents are all arrays or objects.
	 */
	isUniqueByDependants?: boolean;

	/**
	 * Cache head.
	 */
	head?: CacheNode;

	/**
	 * Dependants from previous invocation.
	 */
	lastDependants?: unknown[];
};

type CacheMap = WeakMap<object, Cache | CacheMap>;

type RootCache = WeakMap<object, CacheMap>;

/**
 * Arbitrary value used as key for referencing cache object in WeakMap tree.
 */
var LEAF_KEY: {} = {};

/**
 * Returns the first argument as the sole entry in an array.
 *
 * @param value Value to return.
 *
 * @return Value returned as entry in array.
 */
function arrayOf<T>(value: T): [T] {
	return [value];
}

/**
 * Creates and returns a new cache object.
 *
 * @return Cache object.
 */
function createCache(): Cache {
	return {
		clear() {
			this.head = null;
		},
	};
}

/**
 * Returns a memoized selector function. The getDependants function argument is
 * called before the memoized selector and is expected to return an immutable
 * reference or array of references on which the selector depends for computing
 * its own return value. The memoize cache is preserved only as long as those
 * dependant references remain the same. If getDependants returns a different
 * reference(s), the cache is cleared and the selector value regenerated.
 *
 * @param selector Selector function.
 * @param getDependants Dependant getter returning an array of references used
 * in cache bust consideration.
 */
export function createSelector<S extends (...args: any[]) => any>(
	selector: S,
	getDependants?: GetDependants
): S & EnhancedSelector {
	let rootCache = new WeakMap();

	const normalizedGetDependants: GetDependants = getDependants
		? getDependants
		: arrayOf;

	/**
	 * Returns the cache for a given dependants array. When possible, a WeakMap
	 * will be used to create a unique cache for each set of dependants. This
	 * is feasible due to the nature of WeakMap in allowing garbage collection
	 * to occur on entries where the key object is no longer referenced. Since
	 * WeakMap requires the key to be an object, this is only possible when the
	 * dependant is object-like. The root cache is created as a hierarchy where
	 * each top-level key is the first entry in a dependants set, the value a
	 * WeakMap where each key is the next dependant, and so on. This continues
	 * so long as the dependants are object-like. If no dependants are object-
	 * like, then the cache is shared across all invocations.
	 *
	 * @see isObject
	 *
	 * @param dependants Selector dependants.
	 *
	 * @return Cache object.
	 */
	function getCache(dependants: unknown[]): Cache {
		let caches = rootCache,
			isUniqueByDependants = true,
			i,
			dependant,
			map,
			cache;

		for (i = 0; i < dependants.length; i++) {
			dependant = dependants[i];

			// Can only compose WeakMap from object-like key.
			if (!isObject(dependant)) {
				isUniqueByDependants = false;
				break;
			}

			// Does current segment of cache already have a WeakMap?
			if (caches.has(dependant)) {
				// Traverse into nested WeakMap.
				caches = caches.get(dependant);
			} else {
				// Create, set, and traverse into a new one.
				map = new WeakMap();
				caches.set(dependant, map);
				caches = map;
			}
		}

		// We use an arbitrary (but consistent) object as key for the last item
		// in the WeakMap to serve as our running cache.
		if (!caches.has(LEAF_KEY)) {
			cache = createCache();
			cache.isUniqueByDependants = isUniqueByDependants;
			caches.set(LEAF_KEY, cache);
		}

		return caches.get(LEAF_KEY);
	}

	/**
	 * Resets root memoization cache.
	 */
	function clear() {
		rootCache = new WeakMap();
	}

	/* eslint-disable jsdoc/check-param-names */
	/**
	 * The augmented selector call, considering first whether dependants have
	 * changed before passing it to underlying memoize function.
	 *
	 * @param {*}    source    Source object for derivation.
	 * @param {...*} extraArgs Additional arguments to pass to selector.
	 *
	 * @return {*} Selector result.
	 */
	/* eslint-enable jsdoc/check-param-names */
	function callSelector(/* source, ...extraArgs */) {
		let len = arguments.length,
			cache,
			node,
			i,
			args,
			dependants;

		// Create copy of arguments (avoid leaking deoptimization).
		args = new Array(len);
		for (i = 0; i < len; i++) {
			args[i] = arguments[i];
		}

		dependants = normalizedGetDependants.apply(null, args);
		cache = getCache(dependants);

		// If not guaranteed uniqueness by dependants (primitive type), shallow
		// compare against last dependants and, if references have changed,
		// destroy cache to recalculate result.
		if (!cache.isUniqueByDependants) {
			if (
				cache.lastDependants &&
				!isShallowEqual(dependants, cache.lastDependants, 0)
			) {
				cache.clear();
			}

			cache.lastDependants = dependants;
		}

		node = cache.head;
		while (node) {
			// Check whether node arguments match arguments
			if (!isShallowEqual(node.args, args, 1)) {
				node = node.next;
				continue;
			}

			// At this point we can assume we've found a match

			// Surface matched node to head if not already
			if (node !== cache.head) {
				// Adjust siblings to point to each other.
				/** @type {CacheNode} */ node.prev.next = node.next;
				if (node.next) {
					node.next.prev = node.prev;
				}

				node.next = cache.head;
				node.prev = null;
				/** @type {CacheNode} */ cache.head.prev = node;
				cache.head = node;
			}

			// Return immediately
			return node.val;
		}

		// No cached value found. Continue to insertion phase:

		node = /** @type {CacheNode} */ {
			// Generate the result from original function
			val: selector.apply(null, args),
		};

		// Avoid including the source object in the cache.
		args[0] = null;
		node.args = args;

		// Don't need to check whether node is already head, since it would
		// have been returned above already if it was

		// Shift existing head down list
		if (cache.head) {
			cache.head.prev = node;
			node.next = cache.head;
		}

		cache.head = node;

		return node.val;
	}

	callSelector.getDependants = normalizedGetDependants;
	callSelector.clear = clear;
	clear();

	return /** @type {S & EnhancedSelector} */ callSelector;
}
