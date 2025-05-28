import { Button, Icon } from 'bloomer';
import { Button as ButtonProps } from 'bloomer/lib/elements/Button';
import * as React from 'react';
import { Link, LinkProps, useHistory } from 'react-router-dom';

type LinkButtonProps = ButtonProps<HTMLAnchorElement> &
  Omit<LinkProps, 'component' | 'innerRef'> & { dataAction?: string; icon?: string };

export const LinkButton: React.FC<LinkButtonProps> = (props) => {
  const { dataAction, icon, ...otherProps } = props;
  const { to, replace, ...buttonProps } = otherProps;

  const iconTag = icon ? <Icon isSize={props.isSize} className={icon} /> : null;

  return (
    <Link
      to={to}
      component={({ href, navigate }) => {
        return (
          <Button
            href={href}
            onClick={(e: React.SyntheticEvent) => {
              e.preventDefault();
              navigate();
            }}
            {...buttonProps}
          >
            {iconTag}
            {props.children}
          </Button>
        );
      }}
    />
  );
};

export const BackButton: React.FC<ButtonProps<HTMLAnchorElement>> = (props) => {
  const { goBack } = useHistory();
  return (
    <Button isColor="light" data-action="cancel" {...props} onClick={() => goBack()}>
      {props.children || <span>Cancel</span>}
    </Button>
  );
};
