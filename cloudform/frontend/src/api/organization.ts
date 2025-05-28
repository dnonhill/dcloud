import { Dispatch } from 'redux';

import { apiPromise } from './promise';

export interface Organization {
  id: number;
  tenantName: string;
  address: string;
}

export type OrganizationResponse = Organization[];

const organizationApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);
  return {
    get: () =>
      api<OrganizationResponse>({
        url: 'organizes/',
      }),
  };
};

export default organizationApi;
