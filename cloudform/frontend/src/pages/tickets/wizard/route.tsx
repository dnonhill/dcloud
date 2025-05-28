import React from 'react';
import { Redirect, Route, Switch, useHistory, useRouteMatch } from 'react-router-dom';

import { TicketRequest } from '../../../api/ticket';
import ApproverStepPage from './approver-step';
import DataCenterStepPage from './data-center-step';
import DonePage from './done';
import ResourcesStep from './resources-step/routes';
import ReviewStepPage from './review-step';

interface TicketWizardRoutesProps {
  onSubmit: (ticket: TicketRequest) => Promise<any>;
}

const TicketWizardRoutes: React.FC<TicketWizardRoutesProps> = (props) => {
  const history = useHistory();
  const match = useRouteMatch();

  if (!match) return null;
  const { path, url } = match;

  return (
    <Switch>
      <Route
        path={`${path}/data-center`}
        render={() => <DataCenterStepPage onNext={() => history.push('resources')} />}
      />
      <Route
        path={`${path}/resources`}
        render={() => (
          <ResourcesStep
            onNext={() => {
              console.log('Next');
              history.push('approver');
            }}
          />
        )}
      />
      <Route path={`${path}/approver`} render={() => <ApproverStepPage onNext={() => history.push('review')} />} />
      <Route path={`${path}/review`} render={() => <ReviewStepPage onSubmit={props.onSubmit} />} />
      <Route path={`${path}/done`} component={DonePage} />
      <Redirect to={`${url}/data-center`} />
    </Switch>
  );
};

export default TicketWizardRoutes;
