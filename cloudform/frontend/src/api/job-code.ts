import { Dispatch } from 'redux';

import { apiPromise } from './promise';

export interface JobCodeProperty {
  orderNumber?: string;
  requestcctr?: string;
  respCostCenter?: string;
  auart?: string;
  description?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  descZcoOrcus?: string;
  descZcoOrprt?: string;
  reasonEnvInvestDesc?: string;
  reasonEnvInvestCode?: string;
}

export type JobCodeResponse = JobCodeProperty;

const jobCodeApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);
  return {
    get: (id: string | undefined) =>
      api<JobCodeResponse>({
        url: `job-code/${id}`,
      }),
  };
};

export default jobCodeApi;
