import { Action } from 'redux';

export const ENQUEUE = 'show_snackbar';
export const DEQUEUE = 'dismiss_snackbar';

interface EnqueueNotificationAction extends Action {
  type: typeof ENQUEUE;
  payload: { type: string; message: string | JSX.Element };
}

interface DequeueNotificationAction extends Action {
  type: typeof DEQUEUE;
}

export type SnackbarActionType = EnqueueNotificationAction | DequeueNotificationAction;
