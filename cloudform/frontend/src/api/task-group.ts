import { Dispatch } from 'redux';

import { DataCenterProperty } from './data-center';
import { apiPromise } from './promise';
import { TicketItemProperty } from './ticket';
import { BriefUser } from './user';

interface TicketInfo {
  ticketNo: string;
  dataCenter: DataCenterProperty;
  jobCode: string;
  createdBy: BriefUser;
}

export interface TaskGroupResponse {
  id: number;
  ticketItem: TicketItemProperty;
  ticket: TicketInfo;
  assignee: number;

  complete: boolean;
  result: any;
}

export interface TaskGroupBriefResponse {
  id: number;
  ticketItem: TicketItemProperty;
  complete: boolean;
  result: any;
}

const taskGroupApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);
  return {
    listByAssignment: (assignmentId: string | number) => {
      return api<TaskGroupBriefResponse[]>({
        url: `assignments/${assignmentId}/task-groups/`,
      });
    },

    get: (id: string | number) => {
      return api<TaskGroupResponse>({
        url: `task-groups/${id}/`,
      });
    },

    markComplete: (id: string | number, result: any) => {
      return api({
        url: `task-groups/${id}/mark-complete/`,
        method: 'POST',
        data: { result },
      });
    },

    collectResults: (id: string | number) => {
      return api<{ results: any }>({
        url: `/task-groups/${id}/collect-results/`,
      });
    },
  };
};

export default taskGroupApi;
