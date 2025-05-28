export interface SnackbarNotification {
  type: string;
  message: string | JSX.Element;
}

export interface SnackbarState {
  notifications: SnackbarNotification[];
}

export interface SnackbarAppState {
  snackbar: SnackbarState;
}
