import { Delete, Notification } from 'bloomer';
import * as React from 'react';
import { useEffect, useState } from 'react';
import * as Redux from 'react-redux';
import { useDispatch } from 'react-redux';

import { dequeue, SnackbarNotification, SnackbarState } from '../redux/snackbar';
import { ApplicationState } from '../redux/state';

type SnackbarProps = SnackbarNotification & {
  animate: string;
  onClick: (e: React.SyntheticEvent) => void;
};

const TIMEOUT_MS = 5000;
export const SnackbarContainer: React.FC = () => {
  const dispatch = useDispatch();
  const snackbar = Redux.useSelector<ApplicationState, SnackbarState>((state) => state.snackbar);

  const data = snackbar.notifications[0];
  const [fadingOut, setFadingOut] = useState(false);

  const dismiss = () => setFadingOut(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (fadingOut) {
      timer = setTimeout(() => {
        dispatch(dequeue());
      }, 1000);
    }
    return () => timer && clearTimeout(timer);
  }, [dispatch, fadingOut]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (data) {
      timer = setTimeout(dismiss, TIMEOUT_MS);
      setFadingOut(false);
    }

    return () => timer && clearTimeout(timer);
  }, [dispatch, data]);

  if (data) {
    const animate = fadingOut ? 'bounceOutDown' : 'bounceInUp';
    return <Snackbar onClick={dismiss} animate={animate} {...data} />;
  } else {
    return <></>;
  }
};

const Snackbar: React.FC<SnackbarProps> = (props) => {
  return (
    <Notification
      isColor={props.type}
      className={`is-marginless animated ${props.animate}`}
      style={{
        position: 'fixed',
        display: 'flex',
        alignItems: 'center',
        minWidth: '50%',
        bottom: '2rem',
        right: '2rem',
        zIndex: 999,
      }}
    >
      <Delete style={{ top: 'auto' }} onClick={props.onClick} />
      {props.message}
    </Notification>
  );
};

export default SnackbarContainer;
