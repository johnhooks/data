export default function isPromise(value: unknown): value is Promise<unknown> {
	return (
		!!value &&
		(typeof value === 'object' || typeof value === 'function') &&
		typeof (value as Promise<unknown>).then === 'function'
	);
}
