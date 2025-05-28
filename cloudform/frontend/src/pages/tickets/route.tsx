import * as React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router';

import EditTicketWizardContainer from './edit';
import TicketViewPage from './view';

const TicketRoutes: React.FC = () => {
  const { path } = useRouteMatch()!;

  return (
    <Switch>
      <Route exact path={path} component={TicketViewPage} />
      <Route path={`${path}/edit`} component={EditTicketWizardContainer} />
    </Switch>
  );
};

export default TicketRoutes;
