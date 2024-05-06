import type { Reducer, Action } from 'redux';

/**
 * Combines multiple reducers into a single reducer function.
 *
 * State is expected to be an object with keys corresponding to the keys of the
 * reducers object. The combined reducer will call each reducer with the slice of
 * state corresponding to the reducer's key, and then combine the results into a
 * single object.
 *
 * @param reducers The reducers to combine.
 *
 * @returns A single reducer function.
 */
export function combineReducers<
	S extends Record<string, unknown>,
	A extends Action<string>,
	K extends keyof S,
	R extends Record<K, Reducer<S[K], A>>,
>(reducers: R): (state: S, action: A) => S {
	const keys = Object.keys(reducers) as K[];

	return function combinedReducer(state = {} as S, action: A) {
		const nextState = {} as S;
		let hasChanged = false;

		for (const key of keys) {
			const reducer = reducers[key];
			const prevStateForKey = state[key];
			const nextStateForKey = reducer(prevStateForKey, action);
			nextState[key] = nextStateForKey;
			hasChanged = hasChanged || nextStateForKey !== prevStateForKey;
		}

		return hasChanged ? nextState : state;
	};
}
