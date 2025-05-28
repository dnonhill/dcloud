import { Column, Columns, Title } from 'bloomer';
import * as React from 'react';

import { ReactComponent as NoData } from '../asset/no_data.svg';

export const IllustratedPage: React.FC = (props) => {
  const { children } = props;

  return <div className="illustration-message">{children}</div>;
};

export const IllustratedMessage: React.FC = (props) => {
  return (
    <Columns className="illustration-status">
      <Column isSize="2/3" isOffset="1/3" isDisplay="flex" className="level">
        <div className="level-left">{props.children}</div>
      </Column>
    </Columns>
  );
};

export const IllustratedMessageIllustration: React.FC = (props) => {
  return <div className="pr-5">{props.children}</div>;
};

export const IllustratedMessageContent: React.FC = (props) => {
  return <div>{props.children}</div>;
};

export const ItemsNotFound: React.FC<{ title?: string }> = ({ title = 'Not Found' }) => (
  <IllustratedPage>
    <NoData />
    <Title>{title}</Title>
  </IllustratedPage>
);
