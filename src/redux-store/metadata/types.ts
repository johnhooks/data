/**
 * Internal dependencies
 */
import type { EquivalentKeyMap } from '../../utils';

export type StartResolution = {
	type: 'START_RESOLUTION';
	selectorName: string;
	args: unknown[];
};

export type FinishResolution = {
	type: 'FINISH_RESOLUTION';
	selectorName: string;
	args: unknown[];
};

export type FailResolution = {
	type: 'FAIL_RESOLUTION';
	selectorName: string;
	args: unknown[];
	error: Error | unknown;
};

export type StartResolutions = {
	type: 'START_RESOLUTIONS';
	selectorName: string;
	args: unknown[][];
};

export type FinishResolutions = {
	type: 'FINISH_RESOLUTIONS';
	selectorName: string;
	args: unknown[][];
};

export type FailResolutions = {
	type: 'FAIL_RESOLUTIONS';
	selectorName: string;
	args: unknown[];
	errors: Array<Error | unknown>;
};

export type InvalidateResolution = {
	type: 'INVALIDATE_RESOLUTION';
	selectorName: string;
	args: unknown[];
};

export type InvalidateResolutionForStore = {
	type: 'INVALIDATE_RESOLUTION_FOR_STORE';
};

export type InvalidateResolutionForStoreSelector = {
	type: 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR';
	selectorName: string;
};

export type Action =
	| StartResolution
	| FinishResolution
	| FailResolution
	| StartResolutions
	| FinishResolutions
	| FailResolutions
	| InvalidateResolution
	| InvalidateResolutionForStore
	| InvalidateResolutionForStoreSelector;

type StateKey = unknown[] | unknown;

export type StateValue =
	| { status: 'resolving' | 'finished' }
	| { status: 'error'; error: Error | unknown };

export type Status = StateValue['status'];

export type State = EquivalentKeyMap<StateKey, StateValue>;
