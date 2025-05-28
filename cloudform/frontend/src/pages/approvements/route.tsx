import React from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router';

import ApprovementDetailPage from './detail';
import ApprovementListPage from './list';

const ApprovementRoutes: React.FC = () => {
  const { path } = useRouteMatch()!;
  return (
    <Switch>
      <Route exact path={`${path}/status-:page`} component={ApprovementListPage} />
      <Route exact path={`${path}/:id`} component={ApprovementDetailPage} />
      <Redirect to={`${path}/status-pending`} />
    </Switch>
  );
};

export default ApprovementRoutes;
