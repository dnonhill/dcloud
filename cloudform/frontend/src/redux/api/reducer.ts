import { Reducer } from 'redux';

import { API_ERROR, API_FINISH, API_START, ApiActions } from './action';
import { ApiMiddlewareState } from './state';

const defaultApiMiddlewareState: ApiMiddlewareState = {
  pendingRequests: 0,
};

export const apiReducer: Reducer<ApiMiddlewareState, ApiActions> = (state = defaultApiMiddlewareState, action) => {
  switch (action.type) {
    case API_START:
      return {
        ...state,
        pendingRequests: state.pendingRequests + 1,
      };

    case API_FINISH:
    case API_ERROR:
      return {
        ...state,
        pendingRequests: state.pendingRequests - 1,
      };
    default:
      return state;
  }
};
