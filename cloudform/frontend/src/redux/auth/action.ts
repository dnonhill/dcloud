import { Action } from 'redux';

import { UserProfile } from './state';

export const LOG_IN = 'log_in';
export const LOG_OUT = 'log_out';
export const LOG_IN_RESULT = 'log_in_result';
export const RE_LOG_IN = 're_log_in';

export interface LoginPayload {
  domain: string | undefined;
  username: string;
  password: string;
  // onSuccess?: (...args: any[]) => any
  // onFailure?: (...args: any[]) => any
}

interface LoginAction extends Action {
  type: typeof LOG_IN;
  payload: LoginPayload;
}

interface LogoutAction extends Action {
  type: typeof LOG_OUT;
}

type LoginSuccessResult = {
  username: string;
  access: string;
  refresh: string;
  profile: UserProfile;
};

type LoginFailureResult = Error;

interface LoginResultAction extends Action {
  type: typeof LOG_IN_RESULT;
  payload: LoginSuccessResult | LoginFailureResult;
  error: boolean;
}

type ReloginPayload = {
  username: string;
  refresh: string;
};

interface ReloginAction extends Action {
  type: typeof RE_LOG_IN;
  payload: ReloginPayload;
}

export type AuthActionTypes = LoginAction | LogoutAction | LoginResultAction | ReloginAction;
