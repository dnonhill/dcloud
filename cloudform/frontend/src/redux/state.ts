import { ApiMiddlewareAppState } from './api';
import { AuthenticationAppState } from './auth';
import { SnackbarAppState } from './snackbar';
import { TicketWizardAppState } from './ticket-wizard';
import { WebSocketMiddlewareAppState } from './websocket/state';

export type ApplicationState = Required<AuthenticationAppState> &
  Required<ApiMiddlewareAppState> &
  Required<TicketWizardAppState> &
  Required<SnackbarAppState> &
  Required<WebSocketMiddlewareAppState>;
