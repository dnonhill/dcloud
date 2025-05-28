import { Action, AnyAction, DeepPartial, Reducer, StoreEnhancer } from 'redux';

import { settings } from './middleware';
import { AuthenticationAppState, AuthenticationState } from './state';

function checkValid(authState: object): authState is AuthenticationState {
  return typeof authState === 'object' && 'username' in authState && 'access' in authState && 'refresh' in authState;
}

export const authStoreEnhancer: StoreEnhancer<{}, AuthenticationAppState> = (createStore) => <
  S,
  A extends Action = AnyAction
>(
  reducer: Reducer<S, A>,
  preloadedState?: DeepPartial<S>,
) => {
  preloadedState = preloadedState || {};

  const authValue = localStorage.getItem(settings.localStorageKey);

  if (authValue === null) {
    return createStore(reducer, preloadedState);
  }

  let authState;
  try {
    authState = JSON.parse(authValue);

    if (!checkValid(authState)) {
      return createStore(reducer, preloadedState);
    }
  } catch (e) {
    return createStore(reducer, preloadedState);
  }

  const state: DeepPartial<S & AuthenticationAppState> = {
    ...preloadedState,
    auth: authState,
  };

  return createStore(reducer, state);
};
