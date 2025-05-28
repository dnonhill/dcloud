import { DEQUEUE, ENQUEUE, SnackbarActionType } from './action';

export function enqueue(message: string | JSX.Element, color = 'light'): SnackbarActionType {
  return { type: ENQUEUE, payload: { type: color, message } };
}

export function dequeue(): SnackbarActionType {
  return { type: DEQUEUE };
}
