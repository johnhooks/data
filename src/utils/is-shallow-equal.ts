/**
 * Returns true if entries within the two arrays are strictly equal by
 * reference from a starting index.
 *
 * @param a First array.
 * @param b Second array.
 * @param fromIndex Index from which to start comparison.
 *
 * @return Whether arrays are shallowly equal.
 */
export default function isShallowEqual(
	a: unknown[],
	b: unknown[],
	fromIndex: number
): boolean {
	if (a.length !== b.length) {
		return false;
	}

	for (let i = fromIndex; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}

	return true;
}
