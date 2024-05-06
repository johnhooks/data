/**
 * Object-like type guard.
 *
 * Returns true if the value passed is object-like, or false otherwise. A value
 * is object-like if it can support property assignment, e.g. object or array.
 *
 * @param value Value to test.
 *
 * @return Whether value is object-like.
 */
export default function isObject(value: unknown): value is Object {
	return !!value && 'object' === typeof value;
}
