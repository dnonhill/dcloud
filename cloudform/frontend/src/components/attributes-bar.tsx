import { Box, Level, LevelItem } from 'bloomer';
import * as React from 'react';

export const AttributesBar: React.FC = (props) => (
  <Box>
    <Level>{props.children}</Level>
  </Box>
);

export const AttributeItem: React.FC = (props) => (
  <LevelItem className="has-text-centered">
    <div>{props.children}</div>
  </LevelItem>
);

export const AttributeHeading: React.FC = (props) => <p className="heading is-uppercase">{props.children}</p>;
