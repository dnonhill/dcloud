import {
  API,
  API_ERROR,
  API_FINISH,
  API_START,
  ApiErrorAction,
  ApiFinishAction,
  ApiPayload,
  ApiStartAction,
} from './action';

export const apiStart = (payload?: ApiPayload): ApiStartAction => ({
  type: API_START,
  payload,
});

export const apiFinish = (payload?: ApiPayload): ApiFinishAction => ({
  type: API_FINISH,
  payload,
});

export const apiError = (error: Error, source?: ApiPayload): ApiErrorAction => ({
  type: API_ERROR,
  payload: {
    error,
    source,
  },
  error: true,
});

export const api = (payload: ApiPayload) => ({
  type: API,
  payload,
});
