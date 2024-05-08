import type { Action } from 'redux';

import {
	invalidateResolution,
	invalidateResolutionForStore,
	invalidateResolutionForStoreSelector,
} from './redux-store/metadata/actions';
import type {
	ActionCreatorsOf as BaseActionCreatorsOf,
	AnyConfig,
	CurriedSelectorsOf,
	StoreDescriptor,
} from './types';

type InvalidateResolution = typeof invalidateResolution;
type InvalidateResolutionForStore = typeof invalidateResolutionForStore;
type InvalidateResolutionForStoreSelector =
	typeof invalidateResolutionForStoreSelector;

type InvalidateResolutionAction = ReturnType<InvalidateResolution>;
type InvalidateResolutionForStoreAction =
	ReturnType<InvalidateResolutionForStore>;
type InvalidateResolutionForStoreSelectorAction =
	ReturnType<InvalidateResolutionForStoreSelector>;

/**
 * The action creators for metadata actions.
 */
type MetadataActionCreators = {
	invalidateResolution: InvalidateResolution;
	invalidateResolutionForStore: InvalidateResolutionForStore;
	invalidateResolutionForStoreSelector: InvalidateResolutionForStoreSelector;
};

/**
 * Dispatchable metadata actions.
 */
type MetadataAction =
	| InvalidateResolutionAction
	| InvalidateResolutionForStoreAction
	| InvalidateResolutionForStoreSelectorAction;

/**
 * The action creators for a store descriptor.
 *
 * Also includes metadata actions creators.
 */
type ActionCreatorsOf<C extends AnyConfig> = BaseActionCreatorsOf<C> &
	MetadataActionCreators;

/**
 * Dispatchable action creators for a store descriptor.
 */
export type RegistryDispatch<S extends string | StoreDescriptor<AnyConfig>> = (
	storeNameOrDescriptor: S
) => S extends StoreDescriptor<infer C> ? ActionCreatorsOf<C> : unknown;

/**
 * Selectors for a store descriptor.
 */
export type RegistrySelect<S extends string | StoreDescriptor<AnyConfig>> = (
	storeNameOrDescriptor: S
) => S extends StoreDescriptor<infer C> ? CurriedSelectorsOf<C> : unknown;

/**
 * Dispatch an action to the configured store.
 */
export type DispatchFunction<A extends Action> = (
	action: A | MetadataAction
) => void;

/**
 * A redux store registry.
 */
export type Registry = {
	dispatch: <S extends string | StoreDescriptor<AnyConfig>>(
		storeNameOrDescriptor: S
	) => S extends StoreDescriptor<infer C> ? ActionCreatorsOf<C> : unknown;
	select: <S extends string | StoreDescriptor<AnyConfig>>(
		storeNameOrDescriptor: S
	) => S extends StoreDescriptor<infer C> ? CurriedSelectorsOf<C> : unknown;
};

/**
 * Thunk arguments.
 */
export type ThunkArgs<
	A extends Action,
	S extends StoreDescriptor<AnyConfig>,
> = {
	/**
	 * Dispatch an action to the store.
	 */
	dispatch: (S extends StoreDescriptor<infer Config>
		? ActionCreatorsOf<Config>
		: unknown) &
		DispatchFunction<A>;

	/**
	 * Selectors for the store.
	 */
	select: CurriedSelectorsOf<S>;

	/**
	 * The store registry object.
	 */
	registry: Registry;
};

/**
 * Thunk.
 */
export type Thunk<
	A extends Action,
	S extends StoreDescriptor<AnyConfig>,
	T extends unknown = void,
> =
	T extends Awaited<infer R>
		? (args: ThunkArgs<A, S>) => Promise<R>
		: (args: ThunkArgs<A, S>) => T;
