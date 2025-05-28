import { Dispatch } from 'redux';

import { PaginatedResponse } from './pagination';
import { apiPromise } from './promise';
import { TicketResponse } from './ticket';
import { User } from './user';

export type ReviewProperty = {
  id: number;
  reviewer: User;
  ticket: TicketResponse;

  note?: string;
  requestedAt: string;
  isReviewed?: boolean;
  isReject?: boolean;
  reviewedAt?: string;
  ticket_timestamp?: string;
};

export type ReviewBriefProperty = Omit<ReviewProperty, 'ticket'> & {
  ticket: number;
  ticketNo: string;
  reviewerId: number;
  applicationName: string;
  projectName: string;
};

export type ReviewResponse = ReviewProperty;

const reviewsApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);

  return {
    list: (params = {}) =>
      api<PaginatedResponse<ReviewBriefProperty>>({
        url: 'reviews/',
        params,
      }),
    get: (id: string | number) =>
      api<ReviewResponse>({
        url: `reviews/${id}/`,
      }),
    getByTicket: (ticketId: string | number) =>
      api<ReviewBriefProperty[]>({
        url: `tickets/${ticketId}/reviewing/`,
      }),
    approve: (id: string | number, ticket_timestamp?: string) =>
      api<ReviewResponse>({
        url: `reviews/${id}/approve/`,
        method: 'PUT',
        data: {
          ticket_timestamp,
        },
      }),
    reject: (id: string | number, note: string, ticket_timestamp?: string) =>
      api<ReviewResponse>({
        url: `reviews/${id}/reject/`,
        method: 'PUT',
        data: {
          note,
          ticket_timestamp,
        },
      }),
    comment: (id: string | number, note: string, ticket_timestamp?: string) =>
      api<ReviewResponse>({
        url: `reviews/${id}/comment/`,
        method: 'PUT',
        data: {
          note,
          ticket_timestamp,
        },
      }),
  };
};

export default reviewsApi;
