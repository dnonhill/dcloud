import { Dispatch } from 'redux';

import { apiPromise } from './promise';
import { UserProperty } from './user';

export interface ApproverProperty {
  id: number;
  user: Omit<UserProperty, 'firstName' | 'lastName' | 'groups'>;
  level?: number;
}

export interface DataCenterProperty {
  id: number;
  name: string;
  defaultJobCode?: string;
  availableResources?: string[];
}

export interface DataCentersResponse {
  results: DataCenterProperty[];
}

export interface ApproverLevelsProperty {
  level: number;
  approvers: ApproverProperty[];
}

export interface ApproversResponse {
  level: number;
  approvers: ApproverProperty[];
}

const dataCenterApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);

  return {
    list: () =>
      api<DataCentersResponse>({
        url: 'data-centers/',
      }),

    queryApprovers: (id: number) =>
      api<ApproverLevelsProperty[]>({
        url: `data-centers/${id}/approvers/`,
      }),
  };
};

export default dataCenterApi;
