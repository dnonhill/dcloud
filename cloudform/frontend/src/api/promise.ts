import { AxiosRequestConfig } from 'axios';
import { Dispatch } from 'redux';

import { api } from '../redux/api';

export const apiPromise = (dispatch: Dispatch) => <T>(payload: AxiosRequestConfig, extraConfig?: {}): Promise<T> => {
  return new Promise((resolve, reject) => {
    dispatch(
      api({
        ...payload,
        ...extraConfig,
        onSuccess: resolve,
        onFailure: reject,
      }),
    );
  });
};
