import { AnyAction, applyMiddleware, combineReducers, compose, createStore, Store } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';

import config from '../config';
import { apiMiddleware, apiReducer } from './api';
import { authReducer, authStoreEnhancer, configureAuthenticationMiddlewares } from './auth';
import { snackbarReducer } from './snackbar';
import { ApplicationState } from './state';
import { ticketWizardReducer } from './ticket-wizard';
import { websocketMiddleware, websocketSubscriptionMiddleware } from './websocket/middleware';
import { websocketReducer } from './websocket/reducer';

export function configureStore(): Store<ApplicationState, AnyAction> {
  const reducers = {
    auth: authReducer,
    api: apiReducer,
    ticketWizard: ticketWizardReducer,
    snackbar: snackbarReducer,
    websocket: websocketReducer,
  };

  const authMiddlewares = configureAuthenticationMiddlewares({
    apiHost: config.API_HOST,
  });

  const middlewares = [...authMiddlewares, apiMiddleware, websocketMiddleware, websocketSubscriptionMiddleware];

  const enhancers = compose(applyMiddleware(...middlewares), authStoreEnhancer);

  return createStore(combineReducers({ ...reducers }), composeWithDevTools(enhancers,));
}
