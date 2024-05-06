import { describe, it, expect } from 'vitest';
import EquivalentKeyMap from './equivalent-key-map.js';

describe('EquivalentKeyMap', () => {
	it('should return equivalent object value', () => {
		const map = new EquivalentKeyMap();
		map.set({ a: 1 }, 10);
		expect(map.get({ a: 1 })).to.equal(10);
	});

	it('should return deep equivalent object value', () => {
		const map = new EquivalentKeyMap();
		map.set({ a: 1, b: { c: 2 } }, 10);
		expect(map.get({ a: 1, b: { c: 2 } })).to.equal(10);
	});

	it('should allow use with non-object key', () => {
		const map = new EquivalentKeyMap();
		map.set('a', 10);
		expect(map.get('a')).to.equal(10);
	});

	it('should not consider array as equivalent to numeric object keys', () => {
		const map = new EquivalentKeyMap();
		map.set({ 0: 'a' }, 10);
		expect(map.get(['a'])).to.be.undefined;
	});

	it('should not consider have conflicts on empty object, array', () => {
		const map = new EquivalentKeyMap();
		map.set({}, 10);
		map.set([], 20);

		expect(map.get({})).to.equal(10);
		expect(map.get([])).to.equal(20);
	});

	it('should not consider numeric object keys as equivalent to array', () => {
		const map = new EquivalentKeyMap();
		map.set(['a'], 10);
		expect(map.get({ 0: 'a' })).to.be.undefined;
	});

	it('accounts for null key', () => {
		const map = new EquivalentKeyMap();
		map.set(null, 10);
		expect(map.get(null)).to.equal(10);
	});

	it('does not expose its internal tree structure at top level', () => {
		const map = new EquivalentKeyMap();
		map.set({ a: 1 }, 10);
		expect(map.get('a')).to.be.undefined;
	});

	it('differentiates by value type', () => {
		const map = new EquivalentKeyMap();
		map.set({ a: 1 }, 10);
		map.set({ a: '1' }, 20);
		expect(map.get({ a: 1 })).to.equal(10);
		expect(map.get({ a: '1' })).to.equal(20);
	});

	it('should return equivalent array value', () => {
		const map = new EquivalentKeyMap();
		map.set(['a'], 10);
		expect(map.get(['a'])).to.equal(10);
	});

	it('should not return non-equivalent object value', () => {
		const map = new EquivalentKeyMap();
		map.set({ a: 1 }, 10);
		expect(map.get({ a: 1, b: 2 })).to.be.undefined;
	});

	it('should not return deep non-equivalent object value', () => {
		const map = new EquivalentKeyMap();
		map.set({ a: 1, b: { c: 2 } }, 10);
		expect(map.get({ a: 1, b: { c: 3 } })).to.be.undefined;
	});

	it('should not return non-equivalent array value', () => {
		const map = new EquivalentKeyMap();
		map.set([1, 2], 10);
		expect(map.get([2, 1])).to.be.undefined;
	});

	it('should return stable equivalent value', () => {
		const map = new EquivalentKeyMap();
		map.set({ a: 1, b: 2 }, 10);
		expect(map.get({ b: 2, a: 1 })).to.equal(10);
	});

	it('replaces last set invocation', () => {
		const map = new EquivalentKeyMap();
		map.set({ a: 1 }, 10);
		const obj = { a: 1 };
		map.set(obj, 20);

		const keys = [...map._map.keys()];
		expect(map.get(obj)).to.equal(20);
		expect(keys).to.have.lengthOf(1);
		expect(keys[0]).to.equal(obj);
	});

	it('memoizes last get invocation', () => {
		const map = new EquivalentKeyMap();
		map.set({ a: 1 }, 10);
		map.get({ a: 1 });
		const obj = { a: 1 };
		map.get(obj);

		const keys = [...map._map.keys()];
		expect(keys).to.have.lengthOf(1);
		expect(keys[0]).to.equal(obj);
	});

	describe('#constructor()', () => {
		it('constructs from iterable key-value array', () => {
			const map = new EquivalentKeyMap([[{ a: 1 }, 10]]);
			expect(map.get({ a: 1 })).to.equal(10);
		});

		it('constructs as clone of EquivalentKeyMap', () => {
			const original = new EquivalentKeyMap();
			original.set('a', 10);
			original.set({ a: 1 }, 20);
			original.set(['a'], 30);
			const copy = new EquivalentKeyMap(original);

			// Values copied.
			expect(copy.get('a')).to.equal(10);
			expect(copy.get({ a: 1 })).to.equal(20);
			expect(copy.get(['a'])).to.equal(30);

			// Changes don't affect original.
			copy.set({ a: 1 }, 30);
			expect(original.get({ a: 1 })).to.equal(20);
			expect(copy.get({ a: 1 })).to.equal(30);
		});

		it('does not attempt to initialize from null iterable argument', () => {
			// Disable reason: Assume will throw if not respecting.
			// eslint-disable-next-line no-new
			new EquivalentKeyMap(null);
		});
	});

	describe('#has()', () => {
		it('returns false for non-included non-object key', () => {
			const map = new EquivalentKeyMap();
			const result = map.has('a');

			expect(result).to.equal(false);
		});

		it('returns true for included non-object key', () => {
			const map = new EquivalentKeyMap();
			map.set('a', 10);
			const result = map.has('a');

			expect(result).to.equal(true);
		});

		it('returns false for non-included object key', () => {
			const map = new EquivalentKeyMap();
			const result = map.has({ a: 1 });

			expect(result).to.equal(false);
		});

		it('returns true for included object key', () => {
			const map = new EquivalentKeyMap();
			map.set({ a: 1 }, 10);
			const result = map.has({ a: 1 });

			expect(result).to.equal(true);
		});

		it('returns false for non-included array key', () => {
			const map = new EquivalentKeyMap();
			const result = map.has(['a', 1]);

			expect(result).to.equal(false);
		});

		it('returns true for included array key', () => {
			const map = new EquivalentKeyMap();
			map.set(['a', 1], 10);
			const result = map.has(['a', 1]);

			expect(result).to.equal(true);
		});

		it('returns true for included falsey value', () => {
			[false, null, 0, undefined].forEach((value) => {
				const map = new EquivalentKeyMap();
				map.set(['a', 1], value);
				const result = map.has(['a', 1]);

				expect(result).to.equal(true);
			});
		});
	});

	describe('#set()', () => {
		it('returns the map instance for non-object key', () => {
			const map = new EquivalentKeyMap();
			const result = map.set('a', 10);

			expect(result).to.equal(map);
		});

		it('returns the map instance for object key', () => {
			const map = new EquivalentKeyMap();
			const result = map.set({ a: 1 }, 10);

			expect(result).to.equal(map);
		});
	});

	describe('#delete()', () => {
		it('returns false if key does not exist', () => {
			const map = new EquivalentKeyMap();
			const result = map.delete('a');

			expect(result).to.equal(false);
		});

		it('returns true if removed object key', () => {
			const map = new EquivalentKeyMap();
			map.set({ a: 1 }, 10);
			const result = map.delete({ a: 1 });

			expect(result).to.equal(true);
			expect(map.get({ a: 1 })).to.be.undefined;
		});

		it('returns true if removed array key', () => {
			const map = new EquivalentKeyMap();
			map.set(['a', 1], 10);
			const result = map.delete(['a', 1]);

			expect(result).to.equal(true);
			expect(map.get(['a', 1])).to.be.undefined;
		});
	});

	describe('#clear()', () => {
		it('resets map', () => {
			const map = new EquivalentKeyMap();
			map.set({ a: 1 }, 10);
			map.clear();

			expect(map.get({ a: 1 })).to.be.undefined;
		});
	});

	describe('#forEach()', () => {
		it('executes callback over map entries', () => {
			const map = new EquivalentKeyMap();
			map.set({ a: 1 }, 10);
			map.set('a', 1);

			const pairs = [];
			const thisArg = {};
			map.forEach(function (value, key, _map) {
				expect(this).to.equal(thisArg);
				expect(_map).to.equal(map);
				pairs.push([key, value]);
			}, thisArg);

			expect(pairs).to.eql([
				[{ a: 1 }, 10],
				['a', 1],
			]);
		});
	});

	describe('#size', () => {
		it('returns size of map', () => {
			const map = new EquivalentKeyMap();
			map.set({ a: 1 }, 10);
			map.set('a', 1);

			expect(map.size).to.equal(2);
		});
	});
});
