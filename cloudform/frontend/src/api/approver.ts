import { Dispatch } from 'redux';

import { apiPromise } from './promise';

export interface ApproverProperty {
  id?: number;
  username: string;
  email: string;
  fullname: string;
  domain: string;
}

export type ApproverRequest = Pick<ApproverProperty, 'id' | 'domain' | 'username'>;
export type ApproverResponse = {
  results: ApproverProperty[];
};

const approverApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);
  return {
    list: () =>
      api<ApproverResponse>({
        url: 'groups/approver/users/',
      }).then((resp) => resp.results),

    create: (data: ApproverRequest) =>
      api<ApproverRequest>({
        url: 'groups/approver/grant/',
        method: 'POST',
        data,
      }),

    delete: (data: ApproverRequest) =>
      api<ApproverRequest>({
        url: 'groups/approver/revoke/',
        method: 'POST',
        data,
      }),
  };
};

export default approverApi;
