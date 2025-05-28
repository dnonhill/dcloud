import { Reducer } from 'redux';

import { WS_STATUS_DOWN, WS_STATUS_UP, WsActions } from './action';
import { WebSocketMiddlewareState } from './state';

const defaultWebScoketState: WebSocketMiddlewareState = {
  status: 'down',
};

export const websocketReducer: Reducer<WebSocketMiddlewareState, WsActions> = (
  state = defaultWebScoketState,
  action,
) => {
  switch (action.type) {
    case WS_STATUS_UP:
      return {
        ...state,
        status: 'up',
      };
    case WS_STATUS_DOWN:
      return {
        ...state,
        status: 'down',
      };
    default:
      return state;
  }
};
