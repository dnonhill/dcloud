import { Notification } from 'bloomer';
import * as React from 'react';

const ErrorBox: React.FC = (props) => {
  if (!props.children) return null;
  return (
    <Notification isColor="danger" className="animated fadeIn">
      {props.children}
    </Notification>
  );
};

export default ErrorBox;
