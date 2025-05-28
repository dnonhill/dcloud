import { AuthActionTypes, LOG_IN, LOG_IN_RESULT, LOG_OUT, RE_LOG_IN } from './action';
import { LoginPayload } from './action';
import { UserProfile } from './state';

export function login(credential: LoginPayload): AuthActionTypes {
  return {
    type: LOG_IN,
    payload: credential,
  };
}

export function logout(): AuthActionTypes {
  return {
    type: LOG_OUT,
  };
}

export function loginSuccess(username: string, access: string, refresh: string, profile: UserProfile): AuthActionTypes {
  return {
    type: LOG_IN_RESULT,
    payload: { username, access, refresh, profile },
    error: false,
  };
}

export function loginFailure(error: Error): AuthActionTypes {
  return {
    type: LOG_IN_RESULT,
    payload: error,
    error: true,
  };
}

export function relogin(username: string, refresh: string): AuthActionTypes {
  return {
    type: RE_LOG_IN,
    payload: {
      username,
      refresh,
    },
  };
}
