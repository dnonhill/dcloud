import { Dispatch } from 'redux';

import { PaginatedResponse } from './pagination';
import { apiPromise } from './promise';
import { TicketResponse } from './ticket';
import { User } from './user';

export type ApprovementProperty = {
  id: number;
  approver: User;
  ticket: TicketResponse;
  approverLevel: number;

  reason?: string;
  requestedAt: string;
  isApproved?: boolean;
  approvedAt?: string;

  ticket_timestamp?: string;
};

export type ApprovementBriefProperty = Omit<ApprovementProperty, 'ticket'> & {
  ticket: number;
  ticketNo: string;
  ticketStatus: string;
  approverId: number;
  applicationName: string;
  projectName: string;
};

export type ApprovementResponse = ApprovementProperty;

const approvementsApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);

  return {
    list: (params = {}) =>
      api<PaginatedResponse<ApprovementBriefProperty>>({
        url: 'approvements/',
        params,
      }),
    get: (id: string | number) =>
      api<ApprovementResponse>({
        url: `approvements/${id}/`,
      }),
    getByTicket: (ticketId: string | number) =>
      api<ApprovementBriefProperty[]>({
        url: `tickets/${ticketId}/approvement/`,
      }),
    approve: (id: string | number, ticket_timestamp?: string) =>
      api<ApprovementResponse>({
        url: `approvements/${id}/approve/`,
        method: 'PUT',
        data: {
          ticket_timestamp,
        },
      }),
    reject: (id: string | number, reason: string, ticket_timestamp?: string) =>
      api<ApprovementResponse>({
        url: `approvements/${id}/reject/`,
        method: 'PUT',
        data: {
          reason,
          ticket_timestamp,
        },
      }),
  };
};

export default approvementsApi;
