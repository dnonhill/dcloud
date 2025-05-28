import axios, { AxiosResponse } from 'axios';
import { Middleware } from 'redux';

import { convertSnakeBodyToCamel, handleErrorResponse } from '../api/attr-style';
import { noError } from '../util';
import { AuthActionTypes, LOG_IN, LOG_IN_RESULT, LOG_OUT, RE_LOG_IN } from './action';
import { loginFailure, loginSuccess } from './creator';

export const settings: Required<AuthenticationMiddlewareSettings> = {
  apiHost: '//localhost:8000',
  localStorageKey: 'auth',
};

function initializeSettings(newSettings: AuthenticationMiddlewareSettings) {
  settings.apiHost = newSettings.apiHost || settings.apiHost;
  settings.localStorageKey = newSettings.localStorageKey || settings.localStorageKey;
}

function logoutUrl() {
  return `${settings.apiHost}logout/`;
}

function tokenApiUrl() {
  return `${settings.apiHost}token/`;
}

function refreshTokenApiUrl() {
  return `${settings.apiHost}token/refresh/`;
}

const authValidateMiddleware: Middleware<{}> = ({ dispatch }) => {
  const handleLoginSuccess = (username: string, refreshOld?: string) => (response: AxiosResponse<any>) => {
    if (response.status !== 200) {
      dispatch(loginFailure(new Error(response.statusText)));
    }

    const { access, refresh = refreshOld, profile } = response.data;

    dispatch(loginSuccess(username, access, refresh, profile));
  };

  const handleLoginFailure = () => (e: any) => {
    let message;

    if (e.response) {
      message = e.response.data.message;
    } else if (e.message) {
      message = e.message;
    } else {
      message = 'Log-in failed';
    }

    dispatch(loginFailure(new Error(message)));
  };

  return (next) => async (action: AuthActionTypes) => {
    next(action);
    axios.interceptors.response.use(convertSnakeBodyToCamel, handleErrorResponse);

    if (action.type === LOG_IN) {
      const { domain, username, password } = action.payload;

      axios
        .get(logoutUrl())
        .then(() =>
          axios
            .post(tokenApiUrl(), { domain, username, password })
            .then(handleLoginSuccess(username))
            .catch(handleLoginFailure()),
        );
    } else if (action.type === RE_LOG_IN) {
      const { username, refresh } = action.payload;

      axios
        .post(refreshTokenApiUrl(), { refresh })
        .then(handleLoginSuccess(username, refresh))
        .catch(handleLoginFailure());
    }
  };
};

const authSessionMiddleware: Middleware<{}> = () => {
  function saveSessionInStorage(session: string) {
    localStorage.setItem(settings.localStorageKey, session);
  }

  function clearSessionInStorage() {
    localStorage.removeItem(settings.localStorageKey);
  }

  return (next) => (action: AuthActionTypes) => {
    next(action);

    if (action.type === LOG_IN_RESULT) {
      const payload = action.payload;
      const session = noError(payload) ? JSON.stringify(payload) : null;

      if (session !== null) {
        saveSessionInStorage(session);
      } else {
        clearSessionInStorage();
      }
    } else if (action.type === LOG_OUT) {
      clearSessionInStorage();
    }
  };
};

const authenticationMiddlewares: Middleware<{}>[] = [authValidateMiddleware, authSessionMiddleware];

export type AuthenticationMiddlewareSettings = {
  apiHost?: string;
  localStorageKey?: string;
};

export function configureAuthenticationMiddlewares(settings?: AuthenticationMiddlewareSettings): Middleware[] {
  if (settings !== undefined) {
    initializeSettings(settings);
  }
  return authenticationMiddlewares;
}
