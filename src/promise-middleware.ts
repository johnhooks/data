/**
 * External dependencies
 */
import type { Middleware } from 'redux';

/**
 * Internal dependencies
 */
import isPromise from './utils/is-promise';

const promiseMiddleware: Middleware = () => (next) => (action) => {
	if (isPromise(action)) {
		return action.then((resolvedAction) => {
			if (resolvedAction) {
				return next(resolvedAction);
			}
		});
	}

	return next(action);
};

export default promiseMiddleware;
