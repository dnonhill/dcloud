import { Dispatch } from 'redux';

import { AuditProperty } from './audit';
import { PaginatedResponse } from './pagination';
import { apiPromise } from './promise';
import { TicketBriefResponse } from './ticket';
import { UserProperty } from './user';

export type AssignmentResponse = AuditProperty & {
  id: number;
  ticket: TicketBriefResponse;
  activeFlag: boolean;
  closedAt: string;
  assignee: UserProperty;
  assigner: UserProperty;
  note: string;
};

const assignmentApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);
  return {
    listApprovedTicket: (listingOption = {}) => {
      return api<PaginatedResponse<TicketBriefResponse>>({
        url: 'tickets/?all=true&status=approved',
        params: listingOption,
      });
    },

    assign: (ticketId: number, assigneeId: number, note?: string) => {
      return api({
        url: 'assignments/',
        method: 'POST',
        data: { ticket: ticketId, assignee: assigneeId, note: note },
      });
    },

    reassign: (ticketId: number, assigneeId: number, note?: string) => {
      return api({
        url: `assignments/${ticketId}/reassign/`,
        method: 'POST',
        data: { assignee: assigneeId, note: note },
      });
    },

    list: (listingOption?: any) => {
      return api<PaginatedResponse<AssignmentResponse>>({
        url: 'assignments/',
        params: listingOption,
      });
    },

    get: (id: number | string) => {
      return api<AssignmentResponse>({
        url: `assignments/${id}/`,
      });
    },

    getByTicket: (ticketId: number | string) => {
      return api<AssignmentResponse>({
        url: `tickets/${ticketId}/assignment/`,
      });
    },

    getNote: (assignmentId: number | string) => {
      return api<AssignmentResponse>({
        url: `notes/${assignmentId}/assignment/`,
      });
    },

    getNoteByTicket: (ticketId: number | string) => {
      return api<AssignmentResponse>({
        url: `notes/${ticketId}/ticket/`,
      });
    },

    close: (id: number | string, note: string | null = null) => {
      const data: { [key: string]: any } = {};
      if (note) data['note'] = note;

      return api({
        url: `assignments/${id}/close/`,
        method: 'POST',
        data: data,
      });
    },
  };
};

export default assignmentApi;
