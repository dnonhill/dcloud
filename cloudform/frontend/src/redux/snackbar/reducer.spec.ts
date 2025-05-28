import { dequeue, enqueue } from './creator';
import { snackbarReducer } from './reducer';

describe('snackbar', () => {
  it('add notification', () => {
    const notification = { type: 'info', message: 'hello' };
    const state = snackbarReducer(undefined, enqueue(notification.message, notification.type));
    expect(state.notifications.length).toEqual(1);
    expect(state.notifications).toContainEqual(notification);
  });

  it('remove notification', () => {
    const notification = { type: 'info', message: 'hello' };
    const state = snackbarReducer({ notifications: [notification] }, dequeue());
    expect(state.notifications.length).toEqual(0);
  });
});
