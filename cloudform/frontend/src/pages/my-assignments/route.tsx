import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import AssignmentDetailPage from './detail';
import ListAssignmentsPage from './list';
import TaskGroupRoutes from './task-groups/route';

const MyAssignmentsRoutes: React.FC = () => {
  const match = useRouteMatch();
  if (!match) return null;

  const { path } = match;

  return (
    <Switch>
      <Route path={`${path}/:assignmentId/task-groups/:id`} component={TaskGroupRoutes} />
      <Route path={`${path}/:id`} component={AssignmentDetailPage} />
      <Route component={ListAssignmentsPage} />
    </Switch>
  );
};

export default MyAssignmentsRoutes;
