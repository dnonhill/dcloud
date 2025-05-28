import { Dispatch, Middleware } from 'redux';

import config from '../../config';
import logger from '../../logger';
import {
  Subscription,
  WS_CONNECT,
  WS_DISCONNECT,
  WS_RECEIVE,
  WS_SEND,
  WS_STATUS_DOWN,
  WS_SUBSCRIBE,
  WS_UNSUBSCRIBE,
  WsActions,
  WsSubscriptionActions,
} from './action';
import { wsReceive, wsStatusDown, wsStatusUp } from './creator';

function createWsSocket(wsUrl: string, dispatch: Dispatch) {
  const socket = new WebSocket(wsUrl);

  socket.addEventListener('open', (event) => {
    logger.log('websocket open: ' + socket.url);
    dispatch(wsStatusUp());
  });

  socket.addEventListener('close', (event) => {
    logger.error('websocket close: ' + socket.url);
    dispatch(wsStatusDown());
  });

  socket.addEventListener('error', (event) => {
    logger.log('websocket error: ', event);
  });

  socket.addEventListener('message', (event) => {
    logger.log('websocket message:', event.data);
    const data: { type: string; data: any } = JSON.parse(event.data);
    dispatch(wsReceive(data.type, data));
  });

  return socket;
}

function isReadyState(websocket: WebSocket | null) {
  return websocket && websocket.readyState === 1;
}

export const websocketMiddleware: Middleware = ({ dispatch }) => {
  let websocket: WebSocket | null;

  return (next) => (action) => {
    next(action);

    if (action.type === WS_CONNECT) {
      if (websocket == null) {
        websocket = createWsSocket(config.WS_HOST, dispatch);
      }
    } else if (action.type === WS_DISCONNECT) {
      if (websocket && isReadyState(websocket)) {
        websocket.close();
      }
    } else if (action.type === WS_STATUS_DOWN) {
      websocket = null;
    } else if (action.type === WS_SEND) {
      if (websocket && isReadyState(websocket)) {
        websocket.send(JSON.stringify(action.payload));
      } else {
        if (action.payload.errorCallback != null) {
          action.payload.errorCallback(new Error());
        }
      }
    }
  };
};

export const websocketSubscriptionMiddleware: Middleware = ({ dispatch }) => {
  const subscriptions: Subscription[] = [];

  // TODO Possible to match by wildcard in next version
  const subjectMatch = (s1: string, s2: string) => s1 === s2;

  const subscriptionMatch = (n: Subscription) => (s: Subscription) =>
    subjectMatch(n.subject, s.subject) && n.subscriber === s.subscriber;

  const subscriptionExists = (n: Subscription) => subscriptions.some(subscriptionMatch(n));

  return (next) => (action: WsActions | WsSubscriptionActions) => {
    next(action);

    if (action.type === WS_SUBSCRIBE) {
      if (!subscriptionExists(action.payload)) {
        subscriptions.push(action.payload);
      }
    } else if (action.type === WS_UNSUBSCRIBE) {
      subscriptions.filter((s) => !subscriptionMatch(action.payload));
    } else if (action.type === WS_RECEIVE) {
      subscriptions.forEach((subscription) => {
        if (subjectMatch(subscription.subject, action.payload.type)) {
          subscription.subscriber(action.payload.data);
        }
      });
    }
  };
};
