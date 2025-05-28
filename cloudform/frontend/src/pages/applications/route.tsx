import * as React from 'react';
import { useDispatch } from 'react-redux';
import { Redirect, Route, Switch, useLocation, useParams, useRouteMatch } from 'react-router-dom';

import applicationApi from '../../api/application';
import { DeferRender } from '../../components';
import ResourcesListPage from '../resources/list';
import TicketsByApplication from '../tickets/list';
import NewTicketWizard from '../tickets/new';
import ApplicationContext from './context';
import EditApplicationPage from './edit';
import ApplicationInfoPage from './info';

export const ApplicationRoutes: React.FC = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { search } = useLocation();
  const { path, url } = useRouteMatch()!;
  const isReadOnly = new URLSearchParams(search).get('isReadOnly') === 'true';

  const queryParam = new URLSearchParams(useLocation().search);
  const reloadFlag = !!queryParam.get('reload');

  const applicationLoader = React.useMemo(
    async () => {
      if (!id) throw new Error('No application id supplied.');

      const application = applicationApi(dispatch).get(id);
      return { application: await application };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, id, reloadFlag], // reload required for refresh data when edit
  );

  return (
    <DeferRender
      promise={applicationLoader}
      render={({ application }) => {
        const readOnlyFlag = isReadOnly || !application.activeFlag;

        return (
          <ApplicationContext.Provider value={application}>
            <Switch>
              <Route path={`${path}/edit`} component={EditApplicationPage} />
              <Route path={`${path}/new-ticket`} component={NewTicketWizard} />
              <Route exact path={`${path}/resources`} render={() => <ResourcesListPage isReadOnly={readOnlyFlag} />} />
              <Route exact path={`${path}/tickets`} render={() => <TicketsByApplication isReadOnly={readOnlyFlag} />} />
              <Route path={`${path}/info`} render={() => <ApplicationInfoPage isReadOnly={readOnlyFlag} />} />
              <Redirect to={`${url}/resources${search}`} />
            </Switch>
          </ApplicationContext.Provider>
        );
      }}
    />
  );
};
