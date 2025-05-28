import React from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router';

import ReviewDetailPage from './detail';
import ReviewsListPage from './list';

const ReviewRoutes: React.FC = () => {
  const { path } = useRouteMatch()!;
  return (
    <Switch>
      <Route exact path={`${path}/status-:page`} component={ReviewsListPage} />
      <Route exact path={`${path}/:id`} component={ReviewDetailPage} />
      <Redirect to={`${path}/status-pending`} />
    </Switch>
  );
};

export default ReviewRoutes;
