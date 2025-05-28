import { Dispatch } from 'redux';

import { ApplicationResponse } from './application';
import { AssignmentResponse } from './assignment';
import { AuditProperty } from './audit';
import { DataCenterProperty } from './data-center';
import { PaginatedResponse } from './pagination';
import { PricingDetail } from './pricing';
import { ProjectResponse } from './project';
import { apiPromise } from './promise';
import { ResourceProperty } from './resource';
import { UserDomainProperty } from './userdomain';

export interface TicketItemProperty {
  id?: number;
  action: string;
  resourceType: string;
  resource?: number | ResourceProperty;
  specification: any;
  estimatedPrice?: number;
  priceDetail?: Array<PricingDetail>;
  application?: string;
  jobCode?: string;
}

export type TicketItemRequest = TicketItemProperty;
export type TicketItemRequestWithPseudoId = TicketItemRequest & {
  pseudoId: number;
};
export type TicketItemResponse = Omit<TicketItemProperty, 'resource'> & {
  resource?: ResourceProperty;
};

export interface TicketProperty {
  id?: number;
  ticketNo: string;
  application: ApplicationResponse;
  dataCenter: DataCenterProperty;
  jobCode: string;
  items: TicketItemProperty[];
  status: string;
}

export type TicketRequest = Omit<TicketProperty, 'status' | 'ticketNo' | 'application' | 'dataCenter' | 'closedBy'> & {
  approvers: number[];
  application: number;
  dataCenter: number;
};

export interface Approver {
  id: number;
  fullname: string;
  username: string;
}

export type TicketResponse = Omit<TicketProperty, 'items'> &
  AuditProperty & {
    id: number;
    project: ProjectResponse;
    items: TicketItemResponse[];
    noteFromOperator: string | null;
    closedBy?: UserDomainProperty;
  };

export type TicketBriefResponse = Omit<TicketProperty, 'id' | 'items'> &
  AuditProperty & {
    id: number;
    project: ProjectResponse;
    noteFromOperator: string | null;
    closedBy: UserDomainProperty;
    assignments?: AssignmentResponse[];
  };

const ticketApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);
  return {
    list: (params: any) => {
      return api<PaginatedResponse<TicketBriefResponse>>({
        url: '/tickets/',
        params,
      });
    },
    listByApplication: (applicationId: string | number, listingOption?: any) => {
      return api<PaginatedResponse<TicketBriefResponse>>({
        url: `applications/${applicationId}/tickets/`,
        params: listingOption,
      });
    },
    get: (id: string | number, isAdmin: boolean = false) => {
      return api<TicketResponse>({
        url: `/tickets/${id}/`,
      });
    },
    create: (ticket: TicketRequest) => {
      return api<TicketResponse>({
        url: 'tickets/',
        method: 'POST',
        data: ticket,
      });
    },
    update: (id: number | string, ticket: TicketRequest) => {
      return api<TicketResponse>({
        url: `tickets/${id}/`,
        method: 'PUT',
        data: ticket,
      });
    },

    close: (id: number | string, note?: string) => {
      return api<TicketResponse>({
        url: `tickets/${id}/close/`,
        method: 'POST',
        data: { noteFromOperator: note },
      });
    },
  };
};

export default ticketApi;
