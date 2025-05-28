import { noError } from '../util';
import { AuthActionTypes, LOG_IN, LOG_IN_RESULT, LOG_OUT, RE_LOG_IN } from './action';
import { AuthenticationState } from './state';

const defaultAuthenticationState: AuthenticationState = {
  isAuthenticating: false,
};

export function authReducer(state = defaultAuthenticationState, action: AuthActionTypes): AuthenticationState {
  switch (action.type) {
    case LOG_IN:
    case RE_LOG_IN:
      return {
        ...state,
        isAuthenticating: true,
      };

    case LOG_IN_RESULT:
      const payload = action.payload;

      if (noError(payload)) {
        return {
          ...state,
          ...payload,
          isAuthenticating: false,
        };
      } else {
        return {
          ...state,
          isAuthenticating: false,
          error: payload.message,
        };
      }

    case LOG_OUT:
      return defaultAuthenticationState;
    default:
      return state;
  }
}
