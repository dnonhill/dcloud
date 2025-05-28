export type WebSocketMiddlewareAppState = {
  websocket?: WebSocketMiddlewareState;
};

export type WebSocketMiddlewareState = {
  status: 'up' | 'down';
};
