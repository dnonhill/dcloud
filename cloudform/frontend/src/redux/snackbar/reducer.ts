import { DEQUEUE, ENQUEUE, SnackbarActionType } from './action';
import { SnackbarState } from './state';

const initialState: SnackbarState = {
  notifications: [],
};

export function snackbarReducer(state = initialState, action: SnackbarActionType): SnackbarState {
  switch (action.type) {
    case ENQUEUE:
      return { notifications: state.notifications.concat(action.payload) };
    case DEQUEUE:
      return { notifications: state.notifications.slice(1) };
    default:
      return state;
  }
}
