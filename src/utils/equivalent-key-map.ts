type Callback<K, V> = (key: K, value: V, instance: EquivalentKeyMap) => void;

/**
 * Given an instance of EquivalentKeyMap, returns its internal value pair tuple
 * for a key, if one exists. The tuple members consist of the last reference
 * value for the key (used in efficient subsequent lookups) and the value
 * assigned for the key at the leaf node.
 *
 * @param instance EquivalentKeyMap instance.
 * @param key      The key for which to return value pair.
 *
 * @return Value pair, if exists.
 */
function getValuePair(
	instance: EquivalentKeyMap,
	key: unknown
): [unknown, unknown] | undefined {
	const { _map, _arrayTreeMap, _objectTreeMap } = instance;

	// Map keeps a reference to the last object-like key used to set the
	// value, which can be used to shortcut immediately to the value.
	if (_map.has(key)) {
		return _map.get(key);
	}

	// Sort keys to ensure stable retrieval from tree.
	const properties = Object.keys(key).sort();

	// Tree by type to avoid conflicts on numeric object keys, empty value.
	let map = Array.isArray(key) ? _arrayTreeMap : _objectTreeMap;

	for (let i = 0; i < properties.length; i++) {
		const property = properties[i];

		map = map.get(property);
		if (map === undefined) {
			return;
		}

		const propertyValue = key[property];
		map = map.get(propertyValue);
		if (map === undefined) {
			return;
		}
	}

	const valuePair = map.get('_ekm_value');
	if (!valuePair) {
		return;
	}

	// If reached, it implies that an object-like key was set with another
	// reference, so delete the reference and replace with the current.
	_map.delete(valuePair[0]);
	valuePair[0] = key;
	map.set('_ekm_value', valuePair);
	_map.set(key, valuePair);

	return valuePair;
}

/**
 * Variant of a Map object which enables lookup by equivalent (deeply equal)
 * object and array keys.
 */
class EquivalentKeyMap<K = unknown, V = unknown> {
	private _map: Map<K, V>;
	private _arrayTreeMap: Map<K, V>;
	private _objectTreeMap: Map<K, V>;

	/**
	 * Constructs a new instance of EquivalentKeyMap.
	 *
	 * @param iterable Initial pair of key, value for map.
	 */
	constructor(iterable?: Iterable<unknown> | null) {
		this.clear();

		if (iterable instanceof EquivalentKeyMap) {
			// Map#forEach is only means of iterating with support for IE11.
			const iterablePairs = [];
			iterable.forEach((value, key) => {
				iterablePairs.push([key, value]);
			});

			iterable = iterablePairs;
		}

		if (iterable != null) {
			for (let i = 0; i < iterable.length; i++) {
				this.set(iterable[i][0], iterable[i][1]);
			}
		}
	}

	/**
	 * Accessor property returning the number of elements.
	 *
	 * @return {number} Number of elements.
	 */
	get size() {
		return this._map.size;
	}

	/**
	 * Add or update an element with a specified key and value.
	 *
	 * @param key   The key of the element to add.
	 * @param value The value of the element to add.
	 *
	 * @return Map instance.
	 */
	set(key: K, value: V): EquivalentKeyMap<K, V> {
		// Shortcut non-object-like to set on internal Map.
		if (key === null || typeof key !== 'object') {
			this._map.set(key, value);
			return this;
		}

		// Sort keys to ensure stable assignment into tree.
		const properties = Object.keys(key).sort();

		const valuePair = [key, value];

		// Tree by type to avoid conflicts on numeric object keys, empty value.
		let map = Array.isArray(key) ? this._arrayTreeMap : this._objectTreeMap;

		for (let i = 0; i < properties.length; i++) {
			const property = properties[i];

			if (!map.has(property)) {
				map.set(property, new EquivalentKeyMap());
			}

			map = map.get(property);

			const propertyValue = key[property];
			if (!map.has(propertyValue)) {
				map.set(propertyValue, new EquivalentKeyMap());
			}

			map = map.get(propertyValue);
		}

		// If an _ekm_value exists, there was already an equivalent key. Before
		// overriding, ensure that the old key reference is removed from map to
		// avoid memory leak of accumulating equivalent keys. This is, in a
		// sense, a poor man's WeakMap, while still enabling iterability.
		const previousValuePair = map.get('_ekm_value');
		if (previousValuePair) {
			this._map.delete(previousValuePair[0]);
		}

		map.set('_ekm_value', valuePair);
		this._map.set(key, valuePair);

		return this;
	}

	/**
	 * Returns a specified element.
	 *
	 * @param key The key of the element to return.
	 *
	 * @return The element associated with the specified key or undefined
	 *              if the key can't be found.
	 */
	get(key: K): V | undefined {
		// Shortcut non-object-like to get from internal Map.
		if (key === null || typeof key !== 'object') {
			return this._map.get(key);
		}

		const valuePair = getValuePair(this, key);
		if (valuePair) {
			return valuePair[1];
		}
	}

	/**
	 * Returns a boolean indicating whether an element with the specified key
	 * exists or not.
	 *
	 * @param key The key of the element to test for presence.
	 *
	 * @return Whether an element with the specified key exists.
	 */
	has(key: K): boolean {
		if (key === null || typeof key !== 'object') {
			return this._map.has(key);
		}

		// Test on the _presence_ of the pair, not its value, as even undefined
		// can be a valid member value for a key.
		return getValuePair(this, key) !== undefined;
	}

	/**
	 * Removes the specified element.
	 *
	 * @param key The key of the element to remove.
	 *
	 * @return Returns true if an element existed and has been
	 *                   removed, or false if the element does not exist.
	 */
	delete(key: K): boolean {
		if (!this.has(key)) {
			return false;
		}

		// This naive implementation will leave orphaned child trees. A better
		// implementation should traverse and remove orphans.
		this.set(key, undefined as V);

		return true;
	}

	/**
	 * Executes a provided function once per each key/value pair, in insertion
	 * order.
	 *
	 * @param callback Function to execute for each element.
	 * @param thisArg  Value to use as `this` when executing `callback`.
	 */
	forEach(callback: Callback<K, V>, thisArg: unknown = this) {
		this._map.forEach((value, key) => {
			// Unwrap value from object-like value pair.
			if (key !== null && typeof key === 'object') {
				value = value[1];
			}

			callback.call(thisArg, value, key, this);
		});
	}

	/**
	 * Returns the values of the EquivalentKeyMap object.
	 */
	values(): IterableIterator<V> {
		return this._map.values();
	}

	/**
	 * Whether some of the elements of this map satisfy the testing function.
	 */
	some(callback: (key: K, value: V) => boolean): boolean {
		for (const [key, value] of this._map) {
			if (callback(key, value[1])) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Removes all elements.
	 */
	clear() {
		this._map = new Map();
		this._arrayTreeMap = new Map();
		this._objectTreeMap = new Map();
	}
}

export default EquivalentKeyMap;
