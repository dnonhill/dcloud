import {
  Subscriber,
  WS_CONNECT,
  WS_DISCONNECT,
  WS_RECEIVE,
  WS_SEND,
  WS_STATUS_DOWN,
  WS_STATUS_UP,
  WS_SUBSCRIBE,
  WS_UNSUBSCRIBE,
  WsConnectAction,
  WsDisconnectAction,
  WsReceiveAction,
  WsSendAction,
  WsStatusDownAction,
  WsStatusUpAction,
  WsSubscribeAction,
  WsUnsubcribeAction,
} from './action';

export const wsConnect = (): WsConnectAction => ({
  type: WS_CONNECT,
});

export const wsDisconnect = (): WsDisconnectAction => ({
  type: WS_DISCONNECT,
});

export const wsStatusUp = (): WsStatusUpAction => ({
  type: WS_STATUS_UP,
});

export const wsStatusDown = (): WsStatusDownAction => ({
  type: WS_STATUS_DOWN,
});

export const wsReceive = <T>(type: string, data: T): WsReceiveAction<T> => ({
  type: WS_RECEIVE,
  payload: {
    type,
    data,
  },
});

export const wsSend = <T>(type: string, data?: T): WsSendAction<T> => ({
  type: WS_SEND,
  payload: {
    type,
    data,
  },
});

export const wsSubscribe = <T>(subject: string, subscriber: Subscriber<T>): WsSubscribeAction<T> => ({
  type: WS_SUBSCRIBE,
  payload: {
    subject,
    subscriber,
  },
});

export const wsUnsubscribe = <T>(subject: string, subscriber: Subscriber<T>): WsUnsubcribeAction<T> => ({
  type: WS_UNSUBSCRIBE,
  payload: {
    subject,
    subscriber,
  },
});
