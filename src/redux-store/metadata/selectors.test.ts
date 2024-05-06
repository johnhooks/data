/**
 * External dependencies
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Internal dependencies
 */
import { createRegistry } from '../../registry';

const getFooSelector = (state) => state;

const testStore = {
	reducer: (state = null, action) => {
		if (action.type === 'RECEIVE') {
			return action.items;
		}

		return state;
	},
	selectors: {
		getFoo: getFooSelector,
	},
};

async function resolve(registry, selector) {
	try {
		await registry.resolveSelect('store')[selector]();
	} catch (e) {}
}

describe('hasStartedResolution', () => {
	let registry;
	beforeEach(() => {
		registry = createRegistry();
		registry.registerStore('testStore', testStore);
	});

	it('returns false if not has started', () => {
		const result = registry
			.select('testStore')
			.hasStartedResolution('getFoo', []);

		expect(result).toBe(false);
	});

	it('returns true if has started', () => {
		registry.dispatch('testStore').startResolution('getFoo', []);
		const { hasStartedResolution } = registry.select('testStore');
		const result = hasStartedResolution('getFoo', []);

		expect(result).toBe(true);
	});
});

describe('hasFinishedResolution', () => {
	let registry;
	beforeEach(() => {
		registry = createRegistry();
		registry.registerStore('testStore', testStore);
	});

	it('returns false if not has finished', () => {
		registry.dispatch('testStore').startResolution('getFoo', []);
		const { hasFinishedResolution } = registry.select('testStore');
		const result = hasFinishedResolution('getFoo', []);

		expect(result).toBe(false);
	});

	it('returns true if has finished', () => {
		registry.dispatch('testStore').finishResolution('getFoo', []);
		const { hasFinishedResolution } = registry.select('testStore');
		const result = hasFinishedResolution('getFoo', []);

		expect(result).toBe(true);
	});
});

describe('isResolving', () => {
	let registry;
	beforeEach(() => {
		registry = createRegistry();
		registry.registerStore('testStore', testStore);
	});

	it('returns false if not has started', () => {
		const { isResolving } = registry.select('testStore');
		const result = isResolving('getFoo', []);

		expect(result).toBe(false);
	});

	it('returns false if has finished', () => {
		registry.dispatch('testStore').startResolution('getFoo', []);
		registry.dispatch('testStore').finishResolution('getFoo', []);
		const { isResolving } = registry.select('testStore');
		const result = isResolving('getFoo', []);

		expect(result).toBe(false);
	});

	it('returns true if has started but not finished', () => {
		registry.dispatch('testStore').startResolution('getFoo', []);
		const { isResolving } = registry.select('testStore');
		const result = isResolving('getFoo', []);

		expect(result).toBe(true);
	});
});

describe('hasResolutionFailed', () => {
	let registry;

	beforeEach(() => {
		registry = createRegistry();
	});

	it('returns false if the resolution has succeeded', async () => {
		registry.registerStore('store', {
			reducer: (state = null, action) => {
				if (action.type === 'RECEIVE') {
					return action.items;
				}

				return state;
			},
			selectors: {
				getFoo: (state) => state,
			},
			resolvers: {
				getFoo: () => {},
			},
		});

		expect(
			registry.select('store').hasResolutionFailed('getFoo')
		).toBeFalsy();

		registry.select('store').getFoo();

		expect(
			registry.select('store').hasResolutionFailed('getFoo')
		).toBeFalsy();
	});

	it('returns true if the resolution has failed', async () => {
		registry.registerStore('store', {
			reducer: (state = null, action) => {
				if (action.type === 'RECEIVE') {
					return action.items;
				}

				return state;
			},
			selectors: {
				getFoo: (state) => state,
			},
			resolvers: {
				getFoo: () => {
					throw new Error('cannot fetch items');
				},
			},
		});

		expect(
			registry.select('store').hasResolutionFailed('getFoo')
		).toBeFalsy();

		await resolve(registry, 'getFoo');

		expect(
			registry.select('store').hasResolutionFailed('getFoo')
		).toBeTruthy();
	});

	it('returns true if the resolution has failed even if the error is falsy', async () => {
		registry.registerStore('store', {
			reducer: (state = null, action) => {
				if (action.type === 'RECEIVE') {
					return action.items;
				}

				return state;
			},
			selectors: {
				getFoo: (state) => state,
			},
			resolvers: {
				getFoo: () => {
					throw null;
				},
			},
		});

		expect(
			registry.select('store').hasResolutionFailed('getFoo')
		).toBeFalsy();

		await resolve(registry, 'getFoo');

		expect(
			registry.select('store').hasResolutionFailed('getFoo')
		).toBeTruthy();
	});
});

describe('getResolutionError', () => {
	let registry;
	let shouldFail;

	beforeEach(() => {
		shouldFail = false;
		registry = createRegistry();

		registry.registerStore('store', {
			reducer: (state = null, action) => {
				if (action.type === 'RECEIVE') {
					return action.items;
				}

				return state;
			},
			selectors: {
				getFoo: (state) => state,
			},
			resolvers: {
				getFoo: () => {
					if (shouldFail) {
						throw new Error('cannot fetch items');
					}
				},
			},
		});
	});

	it('returns undefined if the resolution has succeeded', async () => {
		expect(
			registry.select('store').getResolutionError('getFoo')
		).toBeFalsy();

		registry.select('store').getFoo();

		expect(
			registry.select('store').getResolutionError('getFoo')
		).toBeFalsy();
	});

	it('returns error if the resolution has failed', async () => {
		shouldFail = true;

		expect(
			registry.select('store').getResolutionError('getFoo')
		).toBeFalsy();

		await resolve(registry, 'getFoo');

		expect(
			registry.select('store').getResolutionError('getFoo').toString()
		).toBe('Error: cannot fetch items');
	});

	it('returns undefined if the failed resolution succeeded after retry', async () => {
		shouldFail = true;
		expect(
			registry.select('store').getResolutionError('getFoo')
		).toBeFalsy();

		await resolve(registry, 'getFoo');

		expect(
			registry.select('store').getResolutionError('getFoo')
		).toBeTruthy();

		registry.dispatch('store').invalidateResolution('getFoo', []);

		expect(
			registry.select('store').getResolutionError('getFoo')
		).toBeFalsy();

		shouldFail = false;
		registry.select('store').getFoo();

		expect(
			registry.select('store').getResolutionError('getFoo')
		).toBeFalsy();
	});
});

describe('hasResolvingSelectors', () => {
	let registry;
	beforeEach(() => {
		registry = createRegistry();
		registry.registerStore('testStore', testStore);
	});

	it('returns false if no requests have started', () => {
		const { hasResolvingSelectors } = registry.select('testStore');
		const result = hasResolvingSelectors();

		expect(result).toBe(false);
	});

	it('returns false if all requests have finished', () => {
		registry.dispatch('testStore').startResolution('getFoo', []);
		registry.dispatch('testStore').finishResolution('getFoo', []);
		const { hasResolvingSelectors } = registry.select('testStore');
		const result = hasResolvingSelectors();

		expect(result).toBe(false);
	});

	it('returns true if has started but not finished', () => {
		registry.dispatch('testStore').startResolution('getFoo', []);
		const { hasResolvingSelectors } = registry.select('testStore');
		const result = hasResolvingSelectors();

		expect(result).toBe(true);
	});
});

describe('countSelectorsByStatus', () => {
	let registry;

	beforeEach(() => {
		registry = createRegistry();
		registry.registerStore('store', {
			reducer: (state = null, action) => {
				if (action.type === 'RECEIVE') {
					return action.items;
				}

				return state;
			},
			selectors: {
				getFoo: (state) => state,
				getBar: (state) => state,
				getBaz: (state) => state,
				getFailingFoo: (state) => state,
				getFailingBar: (state) => state,
			},
			resolvers: {
				getFailingFoo: () => {
					throw new Error('error fetching');
				},
				getFailingBar: () => {
					throw new Error('error fetching');
				},
			},
		});
	});

	it('counts selectors properly by status, excluding missing statuses', () => {
		registry.dispatch('store').startResolution('getFoo', []);
		registry.dispatch('store').startResolution('getBar', []);
		registry.dispatch('store').startResolution('getBaz', []);
		registry.dispatch('store').finishResolution('getFoo', []);
		registry.dispatch('store').finishResolution('getBaz', []);

		const { countSelectorsByStatus } = registry.select('store');
		const result = countSelectorsByStatus();

		expect(result).toEqual({
			finished: 2,
			resolving: 1,
		});
	});

	it('counts errors properly', async () => {
		registry.dispatch('store').startResolution('getFoo', []);
		await resolve(registry, 'getFailingFoo');
		await resolve(registry, 'getFailingBar');
		registry.dispatch('store').finishResolution('getFoo', []);

		const { countSelectorsByStatus } = registry.select('store');
		const result = countSelectorsByStatus();

		expect(result).toEqual({
			finished: 1,
			error: 2,
		});
	});

	it('applies memoization and returns the same object for the same state', () => {
		const { countSelectorsByStatus } = registry.select('store');

		expect(countSelectorsByStatus()).toBe(countSelectorsByStatus());

		registry.dispatch('store').startResolution('getFoo', []);
		registry.dispatch('store').finishResolution('getFoo', []);

		expect(countSelectorsByStatus()).toBe(countSelectorsByStatus());
	});

	it('returns a new object when different state is provided', () => {
		const { countSelectorsByStatus } = registry.select('store');

		const result1 = countSelectorsByStatus();

		registry.dispatch('store').startResolution('getFoo', []);
		registry.dispatch('store').finishResolution('getFoo', []);

		const result2 = countSelectorsByStatus();

		expect(result1).not.toBe(result2);
	});
});

describe('Selector arguments normalization', () => {
	let registry;
	beforeEach(() => {
		registry = createRegistry();
		registry.registerStore('testStore', testStore);
	});

	it('should call normalization method on target selector if exists', () => {
		const normalizationFunction = vi.fn((args) => {
			return args.map(Number);
		});
		getFooSelector.__unstableNormalizeArgs = normalizationFunction;

		registry.dispatch('testStore').startResolution('getFoo', [123]);
		const { isResolving, hasStartedResolution, hasFinishedResolution } =
			registry.select('testStore');

		expect(isResolving('getFoo', ['123'])).toBe(true);
		expect(normalizationFunction).toHaveBeenCalledWith(['123']);

		expect(hasStartedResolution('getFoo', ['123'])).toBe(true);
		expect(normalizationFunction).toHaveBeenCalledWith(['123']);

		expect(normalizationFunction).toHaveBeenCalledTimes(2);

		registry.dispatch('testStore').finishResolution('getFoo', [123]);

		expect(hasFinishedResolution('getFoo', ['123'])).toBe(true);
		expect(normalizationFunction).toHaveBeenCalledWith(['123']);

		getFooSelector.__unstableNormalizeArgs = undefined;
	});
});
