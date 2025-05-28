import * as React from 'react';

export const ErrorMessage: React.FC<React.HTMLProps<HTMLParagraphElement>> = (props) => {
  if (props.children)
    return (
      <p {...props} className={`help is-danger ${props.className || ''}`}>
        {props.children}
      </p>
    );
  else return <></>;
};
