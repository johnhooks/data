import type { StoreInstance, AnyConfig } from '../types';
import type { DataRegistry } from '../registry';

const coreDataStore = {
	name: 'core/data',
	instantiate(registry: DataRegistry): StoreInstance<AnyConfig> {
		const getCoreDataSelector =
			(selectorName: string) =>
			(key, ...args: unknown[]) => {
				return registry.select(key)[selectorName](...args);
			};

		const getCoreDataAction =
			(actionName: string) =>
			(key, ...args: unknown[]) => {
				return registry.dispatch(key)[actionName](...args);
			};

		return {
			getSelectors() {
				return Object.fromEntries(
					[
						'getIsResolving',
						'hasStartedResolution',
						'hasFinishedResolution',
						'isResolving',
						'getCachedResolvers',
					].map((selectorName) => [
						selectorName,
						getCoreDataSelector(selectorName),
					])
				);
			},

			getActions() {
				return Object.fromEntries(
					[
						'startResolution',
						'finishResolution',
						'invalidateResolution',
						'invalidateResolutionForStore',
						'invalidateResolutionForStoreSelector',
					].map((actionName) => [
						actionName,
						getCoreDataAction(actionName),
					])
				);
			},

			subscribe() {
				// There's no reasons to trigger any listener when we subscribe to this store
				// because there's no state stored in this store that need to retrigger selectors
				// if a change happens, the corresponding store where the tracking stated live
				// would have already triggered a "subscribe" call.
				return () => () => {};
			},
		};
	},
};

export default coreDataStore;
