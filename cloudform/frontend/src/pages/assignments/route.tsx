import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router';

import AssignPage from './assign';
import ListApprovedRequest from './list';

const AssignmentRoutes: React.FC = () => {
  const match = useRouteMatch();
  if (!match) return null;
  const { path } = match;

  return (
    <Switch>
      <Route path={`${path}/:id`} component={AssignPage} />
      <Route component={ListApprovedRequest} />
    </Switch>
  );
};

export default AssignmentRoutes;
