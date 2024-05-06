/**
 * Internal dependencies
 */
import type { AnyConfig, StoreDescriptor } from './types';
import { createRegistryControl } from './factory';
import { isObject } from './utils';

const SELECT = '@@data/SELECT';
const RESOLVE_SELECT = '@@data/RESOLVE_SELECT';
const DISPATCH = '@@data/DISPATCH';

export interface SelectControlAction {
	type: '@@data/SELECT';
	storeKey: string;
	selectorName: string;
	args: unknown[];
}

export interface ResolveControlAction {
	type: '@@data/RESOLVE_SELECT';
	storeKey: string;
	selectorName: string;
	args: unknown[];
}

export interface DispatchControlAction {
	type: '@@data/DISPATCH';
	storeKey: string;
	actionName: string;
	args: unknown[];
}

export type ControlAction =
	| SelectControlAction
	| ResolveControlAction
	| DispatchControlAction;

/**
 * Dispatches a control action for triggering a synchronous registry select.
 *
 * Note: This control synchronously returns the current selector value, triggering the
 * resolution, but not waiting for it.
 *
 * @param storeNameOrDescriptor Unique namespace identifier for the store
 * @param selectorName          The name of the selector.
 * @param args                  Arguments for the selector.
 *
 * @example
 * ```js
 * import { controls } from '@wordpress/data';
 *
 * // Action generator using `select`.
 * export function* myAction() {
 *   const isEditorSideBarOpened = yield controls.select( 'core/edit-post', 'isEditorSideBarOpened' );
 *   // Do stuff with the result from the `select`.
 * }
 * ```
 *
 * @return The control descriptor.
 */
function select<Config extends AnyConfig>(
	storeNameOrDescriptor: string | StoreDescriptor<Config>,
	selectorName: string,
	...args: unknown[]
): ControlAction {
	return {
		type: SELECT,
		storeKey: isStoreDescriptor(storeNameOrDescriptor)
			? storeNameOrDescriptor.name
			: storeNameOrDescriptor,
		selectorName,
		args,
	};
}

/**
 * Dispatches a control action for triggering and resolving a registry select.
 *
 * Note: when this control action is handled, it automatically considers
 * selectors that may have a resolver. In such case, it will return a `Promise` that resolves
 * after the selector finishes resolving, with the final result value.
 *
 * @param storeNameOrDescriptor Unique namespace identifier for the store
 * @param selectorName          The name of the selector
 * @param args                  Arguments for the selector.
 *
 * @example
 * ```js
 * import { controls } from '@wordpress/data';
 *
 * // Action generator using resolveSelect
 * export function* myAction() {
 * 	const isSidebarOpened = yield controls.resolveSelect( 'core/edit-post', 'isEditorSideBarOpened' );
 * 	// do stuff with the result from the select.
 * }
 * ```
 *
 * @return The control descriptor.
 */
function resolveSelect<Config extends AnyConfig>(
	storeNameOrDescriptor: string | StoreDescriptor<Config>,
	selectorName: string,
	...args: unknown[]
): ControlAction {
	return {
		type: RESOLVE_SELECT,
		storeKey: isStoreDescriptor(storeNameOrDescriptor)
			? storeNameOrDescriptor.name
			: storeNameOrDescriptor,
		selectorName,
		args,
	};
}

/**
 * Dispatches a control action for triggering a registry dispatch.
 *
 * @param storeNameOrDescriptor Unique namespace identifier for the store
 * @param actionName            The name of the action to dispatch
 * @param args                  Arguments for the dispatch action.
 *
 * @example
 * ```js
 * import { controls } from '@wordpress/data-controls';
 *
 * // Action generator using dispatch
 * export function* myAction() {
 *   yield controls.dispatch( 'core/editor', 'togglePublishSidebar' );
 *   // do some other things.
 * }
 * ```
 *
 * @return The control descriptor.
 */
function dispatch<Config extends AnyConfig>(
	storeNameOrDescriptor: string | StoreDescriptor<Config>,
	actionName: string,
	...args: unknown[]
): ControlAction {
	return {
		type: DISPATCH,
		storeKey: isStoreDescriptor(storeNameOrDescriptor)
			? storeNameOrDescriptor.name
			: storeNameOrDescriptor,
		actionName,
		args,
	};
}

export const controls = { select, resolveSelect, dispatch };

export const builtinControls = {
	[SELECT]: createRegistryControl<SelectControlAction>(
		(registry) =>
			({ storeKey, selectorName, args }) =>
				registry.select(storeKey)[selectorName](...args)
	),
	[RESOLVE_SELECT]: createRegistryControl<ResolveControlAction>(
		(registry) =>
			({ storeKey, selectorName, args }) => {
				const method = registry.select(storeKey)[selectorName]
					.hasResolver
					? 'resolveSelect'
					: 'select';
				return registry[method](storeKey)[selectorName](...args);
			}
	),
	[DISPATCH]: createRegistryControl<DispatchControlAction>(
		(registry) =>
			({ storeKey, actionName, args }) =>
				registry.dispatch(storeKey)[actionName](...args)
	),
};

function isStoreDescriptor(
	value: unknown
): value is StoreDescriptor<AnyConfig> {
	return isObject(value) && 'instantiate' in value && 'name' in value;
}
