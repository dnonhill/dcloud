import Axios, { AxiosError, AxiosInstance } from 'axios';
import { Middleware } from 'redux';

import config from '../../config';
import { AuthenticationAppState, logout } from '../auth';
import { API, API_ERROR, ApiActions } from './action';
import axiosInterceptorStyles from './attr-style';
import { apiError, apiFinish, apiStart } from './creator';
import ApiError from './error';

export interface ApiMiddlewareSettings {
  baseURL: string;
}

function configureAxiosInterceptors(axios: AxiosInstance) {
  axiosInterceptorStyles(axios);
}

type ApiErrorDetail = {
  detail: string;
  code: string;
  messages?: ApiErrorMessage[];
};

type ApiErrorMessage = {
  [key: string]: string;
};

const TOKEN_INVALID_CODE = 'token_not_valid';

function isAxiosError<T>(error: any): error is AxiosError<T> {
  return 'response' in error && 'request' in error;
}

export const apiMiddleware: Middleware<{}, AuthenticationAppState> = ({ dispatch, getState }) => {
  function dispatchIfActionReturned(value: any) {
    if (value && 'type' in value && typeof value['type'] === 'string') {
      dispatch(value);
    }
  }

  const settings: ApiMiddlewareSettings = {
    baseURL: config.API_HOST,
  };

  const axios = Axios.create(settings);

  configureAxiosInterceptors(axios);

  return (next) => (action: ApiActions) => {
    next(action);

    if (action.type === API) {
      const { onSuccess = () => {}, onFailure = () => {}, ...axiosRequestConfig } = action.payload;

      const auth = getState().auth;
      if (auth && auth.access) {
        axiosRequestConfig['headers'] = {
          ...axiosRequestConfig['headers'],
          Authorization: `Bearer ${auth.access}`,
        };
      }

      dispatch(apiStart(action.payload));

      axios
        .request(axiosRequestConfig)
        .then(({ data }) => {
          dispatch(apiFinish(action.payload));
          dispatchIfActionReturned(onSuccess(data));
        })
        .catch((error: AxiosError) => {
          dispatch(apiError(error, action.payload));
          const wrappedError = new ApiError(error);
          dispatchIfActionReturned(onFailure(wrappedError));
        });
    } else if (action.type === API_ERROR) {
      const error = action.payload ? action.payload.error : null;

      if (error == null || !isAxiosError<ApiErrorDetail>(error)) {
        return;
      }
      if (error.response === undefined) {
        return;
      }
      const {
        status,
        data: { code },
      } = error.response!;

      if (status === 401 && code === TOKEN_INVALID_CODE) {
        const auth = getState().auth;

        if (auth) {
          dispatch(logout());
          // const { username = "", refresh = "" } = auth
          // dispatch(relogin(username, refresh))
        }
      }
    }
  };
};
