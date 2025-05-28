import { Icon } from 'bloomer';
import { findIndex } from 'lodash';
import * as React from 'react';
import { Link, matchPath, useLocation } from 'react-router-dom';

export interface StepProps {
  to?: string;
  state?: 'current' | 'completed' | 'error';
  title?: string;
  detail: string;
  marker?: string | JSX.Element;
}

const Step: React.FC<StepProps> = ({ to = '#', ...props }) => {
  let markerClass = '';
  if (props.state === 'current') markerClass += 'is-success is-completed';
  else if (props.state === 'completed') markerClass += 'is-success is-completed';
  else if (props.state === 'error') markerClass += 'is-danger is-completed';

  return (
    <div className={`step-item ${markerClass}`}>
      <Link to={to}>
        <div className="step-marker">
          {props.state === 'completed' ? <Icon className="fa fa-check" /> : props.marker}
        </div>
        <div className="step-details">
          {props.title && <p className="step-title">{props.title}</p>}
          <p>{props.detail}</p>
        </div>
      </Link>
    </div>
  );
};

export interface RoutedStepsProps {
  matchRoute: string;
  title?: string;
  marker?: string | JSX.Element;
  detail: string;
}

const RoutedSteps: React.FC<{ routes: RoutedStepsProps[] }> = ({ routes }) => {
  const location = useLocation();
  const pathname = location.pathname;
  const matchingIndex = findIndex(routes, (route) => !!matchPath(pathname, { path: route.matchRoute }));

  return (
    <div className="steps is-small">
      {routes.map((route, i) => {
        const state = i < matchingIndex ? 'completed' : i === matchingIndex ? 'current' : undefined;
        return (
          <Step
            to={i > matchingIndex ? '#' : route.matchRoute.split('/').slice(-1)[0]}
            state={state}
            detail={route.detail}
            title={route.title}
            marker={route.marker || (i + 1).toString()}
            key={i}
          />
        );
      })}
    </div>
  );
};

export default RoutedSteps;
export { Step };
