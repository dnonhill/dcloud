import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router';

import NewApplication from '../applications/new';
import EditProject from './edit';
import ListProjects from './list';
import NewProject from './new';
import ViewProject from './view';

export default () => {
  const { url } = useRouteMatch()!;
  return (
    <Switch>
      <Route exact path={url} component={ListProjects} />
      <Route exact path={`${url}/new`} component={NewProject} />
      <Route exact path={`${url}/:projectId/applications/new`} component={NewApplication} />
      <Route exact path={`${url}/:id`} component={ViewProject} />
      <Route exact path={`${url}/:projectId/edit`} component={EditProject} />
    </Switch>
  );
};
