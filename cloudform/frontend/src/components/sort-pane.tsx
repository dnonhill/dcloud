import { Button, Control, Field, Icon, Label, Level, LevelItem } from 'bloomer';
import React from 'react';

import { OrderDirection } from '../api/list-options';

interface SortPaneProps {
  onDirectionChange: (direction: OrderDirection) => void;
  initial: OrderDirection;
  descendingLabel: string;
  ascendingLabel: string;
}

export const SortPane: React.FC<SortPaneProps> = (props) => {
  const [direction, setDirection] = React.useState<OrderDirection>(props.initial);

  const changeDirection = (newDirection: OrderDirection) => {
    props.onDirectionChange(newDirection);
    setDirection(newDirection);
  };

  return (
    <Level>
      <LevelItem>
        <Label>Sort by</Label>
      </LevelItem>
      <LevelItem>
        <Field hasAddons>
          <Control>
            <Button
              className={direction === 'DSC' ? 'is-primary is-light' : 'is-rounded'}
              onClick={() => changeDirection('DSC')}
            >
              <Icon className="fas fa-history" />
              <span>{props.descendingLabel}</span>
            </Button>
          </Control>
          <Control>
            <Button
              className={direction === 'ASC' ? 'is-primary is-light' : 'is-rounded'}
              onClick={() => changeDirection('ASC')}
            >
              <span className="icon">
                <i className="fas fa-history" style={{ transform: 'scaleX(-1)' }} />
              </span>
              <span>{props.ascendingLabel}</span>
            </Button>
          </Control>
        </Field>
      </LevelItem>
    </Level>
  );
};
