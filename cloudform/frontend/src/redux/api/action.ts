import { AxiosRequestConfig } from 'axios';
import { Action } from 'redux';

import ApiError from './error';

export const API = 'API';
export const API_START = 'API_START';
export const API_FINISH = 'API_FINISH';
export const API_ERROR = 'API_ERROR';

type ApiPromise = {
  onSuccess?: (...args: any[]) => any;
  onFailure?: (error: ApiError) => any;
};
export type ApiPayload = AxiosRequestConfig & ApiPromise;

export interface ApiErrorPayload {
  error: Error;
  source?: ApiPayload;
}

export interface ApiAction extends Action {
  type: typeof API;
  payload: ApiPayload;
}

export interface ApiStartAction extends Action {
  type: typeof API_START;
  payload?: ApiPayload;
}

export interface ApiFinishAction extends Action {
  type: typeof API_FINISH;
  payload?: ApiPayload;
}

export interface ApiErrorAction extends Action {
  type: typeof API_ERROR;
  payload?: ApiErrorPayload;
  error: boolean;
}

export type ApiActions = ApiAction | ApiStartAction | ApiFinishAction | ApiErrorAction;
