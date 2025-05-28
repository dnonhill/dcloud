import { Dispatch } from 'redux';

import { AuditProperty } from './audit';
import { PaginatedResponse } from './pagination';
import { apiPromise } from './promise';

type ProjectProperty = {
  id: number;
  jobCode: string;
  name: string;
  expiredDate: Date | string;
  goLiveDate: Date | string | null;
  owner: any;
  activeFlag: boolean;
  canDelete?: boolean;
};

export type ProjectRequest = Omit<ProjectProperty, 'owner' | 'id' | 'activeFlag' | 'canDelete'>;

export type ProjectResponse = Omit<ProjectProperty, 'expiredDate' | 'goLiveDate'> &
  AuditProperty & {
    expiredDate: string;
    goLiveDate: string | null;
  };

export interface TransferOwnerRequest {
  domain: string | null;
  isLocal: boolean;
  username: string;
}

export const LOCAL_DOMAIN = 'local';

const projectApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);

  return {
    list: (params: any) =>
      api<PaginatedResponse<ProjectResponse>>({
        url: 'projects/',
        params,
      }),

    create: (project: ProjectRequest) =>
      api<ProjectResponse>({
        url: 'projects/',
        method: 'POST',
        data: project,
      }),

    update: (id: number, project: ProjectRequest) => {
      const { jobCode, name, expiredDate, goLiveDate } = project;
      const data = { jobCode, name, expiredDate, goLiveDate };
      return api<ProjectResponse>({
        url: `projects/${id}/`,
        method: 'PATCH',
        data,
      });
    },

    get: (projectId: string | number, params = {}) =>
      api<ProjectResponse>({
        url: `projects/${projectId}/`,
        params,
      }),

    delete: (projectId: string | number) =>
      api<void>({
        url: `projects/${projectId}/`,
        method: 'delete',
      }),

    transferOwner: (projectId: string | number, newOwner: TransferOwnerRequest) => {
      const isLocal = newOwner.domain === LOCAL_DOMAIN;
      const _data = {
        domain: isLocal ? null : newOwner.domain,
        isLocal: isLocal,
        username: newOwner.username,
      };

      return api<ProjectResponse>({
        url: `projects/${projectId}/transfer-owner/`,
        method: 'post',
        data: { newOwner: _data },
      });
    },
  };
};

export default projectApi;
