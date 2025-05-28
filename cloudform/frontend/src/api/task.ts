import { Dispatch } from 'redux';

import { snakeToCamel } from '../redux/api/attr-style';
import { Subscriber } from '../redux/websocket/action';
import { wsSubscribe, wsUnsubscribe } from '../redux/websocket/creator';
import { apiPromise } from './promise';

interface BaseTask {
  id: number;
  description: string;
  complete?: boolean;
}

export const TASK_TYPE_MANUAL = 'manual';
export const TASK_TYPE_SCRIPT = 'script';
export type ManualTask = BaseTask & {
  taskType: typeof TASK_TYPE_MANUAL;
};
export type ScriptTask = BaseTask & {
  taskType: typeof TASK_TYPE_SCRIPT;
  startTime: string | null;
  finishTime: string | null;
  jobUrl: string | null;
  isSuccess: boolean | null;
};

export type Task = ManualTask | ScriptTask;

export type TaskResponse = Task;

export type NewTaskRequest = Pick<Task, 'description'>;

export const taskApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);
  return {
    listByTaskGroup: (taskGroupId: string | number) => {
      return api<TaskResponse[]>({
        url: `task-groups/${taskGroupId}/tasks/`,
      });
    },
    newTask: (taskGroupId: string | number, data: NewTaskRequest) => {
      return api<TaskResponse>({
        url: `task-groups/${taskGroupId}/tasks/`,
        method: 'POST',
        data: data,
      });
    },
    markComplete: (taskId: string | number) => {
      return api<TaskResponse>({
        url: `tasks/${taskId}/mark-complete/`,
        method: 'POST',
      });
    },
    unmarkComplete: (taskId: string | number) => {
      return api<TaskResponse>({
        url: `tasks/${taskId}/unmark-complete/`,
        method: 'POST',
      });
    },
    runScript: (taskId: string | number, vars: any = undefined) => {
      return api<ScriptTask>(
        {
          url: `tasks/${taskId}/run-script/`,
          method: 'POST',
          data: { vars },
        },
        { preservedRequestBody: true },
      );
    },
    extraVars: (taskId: string | number) => {
      return api<object>({ url: `/tasks/${taskId}/extra-vars/` }, { preservedBody: true });
    },
    duplicate: (taskId: string | number) => {
      return api<TaskResponse>({
        url: `/tasks/${taskId}/duplicate/`,
        method: 'POST',
      });
    },
    getStatus: (taskId: string | number, jobId: string | number) => {
      return api<ScriptTask>(
          {
            url: `tasks/${taskId}/get-status/`,
            method: 'POST',
            data: { jobId },
          },
          { preservedRequestBody: true },
      )
    },
  };
};

export const taskSubscriptionApi = (dispatch: Dispatch) => {
  const TASK_COMPLETE = 'taskstatus.complete';

  return {
    taskComplete: (subscriber: Subscriber<Task>) => {
      const subscriberWrapper = (event: any) => {
        subscriber(snakeToCamel(event.task as object) as ScriptTask);
      };
      dispatch(wsSubscribe(TASK_COMPLETE, subscriberWrapper));
      return () => {
        dispatch(wsUnsubscribe(TASK_COMPLETE, subscriberWrapper));
      };
    },
  };
};
