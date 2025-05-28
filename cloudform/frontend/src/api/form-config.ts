import _ from 'lodash';
import { Dispatch } from 'redux';

import { apiPromise } from './promise';

export interface FormConfig {
  value: string;
  display: string;
  extraFields?: { [key: string]: any };
}

export type FormConfigSet = {
  [key: string]: FormConfig[];
};

const formConfigApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);

  return {
    listByPage: async (page: string) => {
      const resp = await api<any>({ url: `form-config/${page}/` });
      const camelizedPage = _.camelCase(page);

      if (!(camelizedPage in resp)) {
        return {};
      }

      return resp[camelizedPage];
    },
  };
};

export default formConfigApi;
