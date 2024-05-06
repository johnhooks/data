/**
 * Internal dependencies
 */
import { createSelector } from '../../create-selector';
import { selectorArgsToStateKey } from './utils';

import { State as ResolutionState, StateValue, Status } from './types';

type State = Record<string, ResolutionState>;

/**
 * Returns the raw resolution state value for a given selector name,
 * and arguments set. May be undefined if the selector has never been resolved
 * or not resolved for the given set of arguments, otherwise true or false for
 * resolution started and completed respectively.
 *
 * @param state        Data state.
 * @param selectorName Selector name.
 * @param args         Arguments passed to selector.
 *
 * @return isResolving value.
 */
export function getResolutionState(
	state: State,
	selectorName: string,
	args?: unknown[]
) {
	const map = state[selectorName];
	if (!map) {
		return;
	}

	return map.get(selectorArgsToStateKey(args)) as StateValue | undefined;
}

// Remove `getIsResolving` as it is deprecated.

/**
 * Returns true if resolution has already been triggered for a given
 * selector name, and arguments set.
 *
 * @param state        Data state.
 * @param selectorName Selector name.
 * @param args         Arguments passed to selector.
 *
 * @return Whether resolution has been triggered.
 */
export function hasStartedResolution(
	state: State,
	selectorName: string,
	args?: unknown[]
) {
	return getResolutionState(state, selectorName, args) !== undefined;
}

/**
 * Returns true if resolution has completed for a given selector
 * name, and arguments set.
 *
 * @param state        Data state.
 * @param selectorName Selector name.
 * @param args         Arguments passed to selector.
 *
 * @return Whether resolution has completed.
 */
export function hasFinishedResolution(
	state: State,
	selectorName: string,
	args?: unknown[]
) {
	const status = getResolutionState(state, selectorName, args)?.status;
	return status === 'finished' || status === 'error';
}

/**
 * Returns true if resolution has failed for a given selector
 * name, and arguments set.
 *
 * @param state        Data state.
 * @param selectorName Selector name.
 * @param args         Arguments passed to selector.
 *
 * @return Has resolution failed
 */
export function hasResolutionFailed(
	state: State,
	selectorName: string,
	args?: unknown[]
) {
	return getResolutionState(state, selectorName, args)?.status === 'error';
}

/**
 * Returns the resolution error for a given selector name, and arguments set.
 * Note it may be of an Error type, but may also be null, undefined, or anything else
 * that can be `throw`-n.
 *
 * @param state        Data state.
 * @param selectorName Selector name.
 * @param args         Arguments passed to selector.
 *
 * @return Last resolution error
 */
export function getResolutionError(
	state: State,
	selectorName: string,
	args?: unknown[]
): Error | unknown | null {
	const resolutionState = getResolutionState(state, selectorName, args);
	return resolutionState?.status === 'error' ? resolutionState.error : null;
}

/**
 * Returns true if resolution has been triggered but has not yet completed for
 * a given selector name, and arguments set.
 *
 * @param state        Data state.
 * @param selectorName Selector name.
 * @param args         Arguments passed to selector.
 *
 * @return Whether resolution is in progress.
 */
export function isResolving(
	state: State,
	selectorName: string,
	args?: unknown[]
) {
	return (
		getResolutionState(state, selectorName, args)?.status === 'resolving'
	);
}

/**
 * Returns the list of the cached resolvers.
 *
 * @param state Data state.
 *
 * @return Resolvers mapped by args and selectorName.
 */
export function getCachedResolvers(state: State) {
	return state;
}

/**
 * Whether the store has any currently resolving selectors.
 *
 * @param state Data state.
 *
 * @return True if one or more selectors are resolving, false otherwise.
 */
export function hasResolvingSelectors(state: State) {
	return Object.values(state).some((selectorState) =>
		selectorState.some((_, resolution) => resolution.status === 'resolving')
	);
}

/**
 * Retrieves the total number of selectors, grouped per status.
 *
 * @param state Data state.
 *
 * @return Object, containing selector totals by status.
 */
export const countSelectorsByStatus = createSelector(
	(state: State) => {
		const selectorsByStatus: Record<string, number> = {};

		Object.values(state).forEach((selectorState) =>
			Array.from(selectorState.values()).forEach((resolution) => {
				const currentStatus = resolution[1]?.status ?? 'error';

				if (!selectorsByStatus[currentStatus]) {
					selectorsByStatus[currentStatus] = 0;
				}

				selectorsByStatus[currentStatus]++;
			})
		);

		return selectorsByStatus;
	},
	(state: State) => [state]
);
