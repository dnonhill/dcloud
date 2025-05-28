import { Action } from 'redux';

export const WS_CONNECT = 'WS_CONNECT';
export const WS_DISCONNECT = 'WS_DISCONNECT';
export const WS_STATUS_UP = 'WS_STATUS_UP';
export const WS_STATUS_DOWN = 'WS_STATUS_DOWN';
export const WS_SEND = 'WS_SEND';
export const WS_RECEIVE = 'WS_RECEIVE';

export interface WsConnectAction extends Action {
  type: typeof WS_CONNECT;
}

export interface WsDisconnectAction extends Action {
  type: typeof WS_DISCONNECT;
}

export interface WsStatusUpAction extends Action {
  type: typeof WS_STATUS_UP;
}

export interface WsStatusDownAction extends Action {
  type: typeof WS_STATUS_DOWN;
}

type WsSendPayload<T> = {
  type: string;
  data?: T;
  errorCallback?: (error: Error) => void;
};

export interface WsSendAction<T = any> extends Action {
  type: typeof WS_SEND;
  payload: WsSendPayload<T>;
}

type WsReceivePayload<T> = {
  type: string;
  data?: T;
};

export interface WsReceiveAction<T = any> extends Action {
  type: typeof WS_RECEIVE;
  payload: WsReceivePayload<T>;
}

export type WsActions =
  | WsConnectAction
  | WsDisconnectAction
  | WsStatusUpAction
  | WsStatusDownAction
  | WsSendAction
  | WsReceiveAction;

export const WS_SUBSCRIBE = 'WS_SUBSCRIBE';
export const WS_UNSUBSCRIBE = 'WS_UNSUBSCRIBE';

export type Subscriber<T> = (data: T) => void;

export type Subscription<T = any> = {
  subject: string;
  subscriber: Subscriber<T>;
};

export type WsSubscriptionPayload<T> = Subscription<T>;

export type WsSubscribeAction<T = any> = {
  type: typeof WS_SUBSCRIBE;
  payload: WsSubscriptionPayload<T>;
};

export type WsUnsubcribeAction<T = any> = {
  type: typeof WS_UNSUBSCRIBE;
  payload: WsSubscriptionPayload<T>;
};

export type WsSubscriptionActions = WsSubscribeAction | WsUnsubcribeAction;
