import _ from 'lodash';
import { Dispatch } from 'redux';

import { AuditProperty } from './audit';
import { PaginatedResponse } from './pagination';
import { ProjectResponse } from './project';
import { apiPromise } from './promise';

interface ApplicationProperty {
  id: number;
  name: string;
  description: string;
  project: number;
  supporterName: string;
  supporterEmail: string;
  supporterDepartment: string;
  supporterOrganization: string;
  systemDiagram: any;
}

export type ApplicationRequest = Omit<ApplicationProperty, 'id'> & { id?: number };
export type ApplicationResponse = Omit<ApplicationProperty, 'project'> &
  AuditProperty & {
    project: ProjectResponse;
    canDelete: boolean;
    activeFlag: boolean;
  };

const applicationApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);

  return {
    get: (applicationId: number | string) => {
      return api<ApplicationResponse>({
        url: `applications/${applicationId}/`,
      });
    },

    list: (projectId?: number | string, params?: any) => {
      return api<PaginatedResponse<ApplicationResponse>>({
        url: (projectId ? `projects/${projectId}/` : '') + 'applications/',
        params,
      });
    },

    create: (projectId: number | string, application: ApplicationRequest) => {
      application.project = typeof projectId === 'number' ? projectId : parseInt(projectId);

      return api<ApplicationResponse>({
        url: `projects/${projectId}/applications/`,
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        data: application,
      });
    },

    update: (applicationId: number | string, application: ApplicationRequest) => {
      application.id = typeof applicationId === 'number' ? applicationId : parseInt(applicationId);

      return api<ApplicationResponse>({
        url: `applications/${applicationId}/`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        data: application,
      });
    },

    delete: (application: ApplicationProperty | ApplicationResponse) =>
      api<void>({
        url:
          `projects/${_.isNumber(application.project) ? application.project : application.project.id}` +
          `/applications/${application.id}/`,
        method: 'DELETE',
      }),
  };
};

export default applicationApi;
