import { Dispatch } from 'redux';

import { DataCenterProperty } from './data-center';
import { PaginatedResponse } from './pagination';
import { apiPromise } from './promise';

export interface ResourceProperty {
  id: number;
  name: string;
  secondaryName: string;
  resourceType: string;
  details: any;
  dataCenter: DataCenterProperty;
  jobCode: string;
  activeFlag: boolean;
}

interface MinimalInfo {
  id: number;
  name: string;
}

export type ResourceDetailProperty = ResourceProperty & {
  application: MinimalInfo;
  project: MinimalInfo;
};

export type ResourceRelationProperty = {
  id: number;
  relation: string;
  description: string;
  application: number;
  applicationName: string;
  resource: number;
  resourceName: string;
  resourceActiveFlag: boolean;
  serviceInventory: number;
  serviceInventoryName: string;
  serviceInventoryDescription: string;
};

export interface ServiceInventoryProperty {
  id: number;
  name: string;
  description: string;
}

export interface ServiceInventoryPropertyResponse {
  results: ServiceInventoryProperty[];
}

export interface BriefTicketItemProperty {
  id: string;
  action: string;
  resourceType: string;
  ticket: number;
  ticketNo: string;
  ticketCreatedBy: string;
  ticketCreatedAt: string;
}

export type CreateResourceRelationProperty = Pick<
  ResourceRelationProperty,
  'relation' | 'description' | 'resource' | 'serviceInventory'
>;

const resourceApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);
  return {
    list: (params?: any) => {
      return api<PaginatedResponse<ResourceProperty>>({
        url: 'resources/',
        params,
      });
    },

    listByApplication: (applicationId: string | number, params?: any) => {
      return api<PaginatedResponse<ResourceProperty>>({
        url: `applications/${applicationId}/resources/`,
        params,
      });
    },

    get: (id: number | string) => {
      return api<ResourceDetailProperty>({
        url: `resources/${id}/`,
      });
    },

    listAppRelation: (params?: any) => {
      return api<PaginatedResponse<ResourceRelationProperty>>({
        url: 'app_relations/',
        params,
      });
    },

    createAppRelation: (data: CreateResourceRelationProperty) => {
      return api<ResourceRelationProperty>({
        method: 'POST',
        url: 'app_relations/',
        data,
      });
    },

    deleteAppRelation: (id: number) => {
      return api({
        method: 'DELETE',
        url: `app_relations/${id}/`,
      });
    },

    listServiceInventory() {
      return api<ServiceInventoryPropertyResponse>({
        url: 'service_inventories/',
      });
    },

    listResourceTicket(resourceId: number | string) {
      return api<PaginatedResponse<BriefTicketItemProperty>>({
        url: `resources/${resourceId}/ticketitems/`,
      });
    },
  };
};

export default resourceApi;
