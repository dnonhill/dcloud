export interface ApiMiddlewareAppState {
  api?: ApiMiddlewareState;
}

export interface ApiMiddlewareState {
  pendingRequests: number;
}
