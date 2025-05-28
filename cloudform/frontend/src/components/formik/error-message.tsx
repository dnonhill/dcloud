import { ErrorMessage, ErrorMessageProps } from 'formik';
import * as React from 'react';

export const FormikErrorMessage: React.FC<ErrorMessageProps> = (props) => {
  return (
    <ErrorMessage {...props}>
      {(message) => {
        return <p className={'help is-danger ' + (props.className || '')}>{message}</p>;
      }}
    </ErrorMessage>
  );
};
