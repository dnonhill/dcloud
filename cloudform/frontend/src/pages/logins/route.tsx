import * as React from 'react';
import { Redirect, Route, Switch, useLocation, useRouteMatch } from 'react-router';

import ForgetPasswordPage from './forget-password';
import LoginPage from './login-page';
import { ActivateAccountPage, RenewPasswordPage } from './reset-password/pages';

const AnonymousRoute: React.FC = () => {
  const { path, url } = useRouteMatch()!;
  const search = useLocation().search;

  return (
    <Switch>
      <Route exact path={path}>
        <Redirect to={`${url}/ptt${search}`} />
      </Route>
      <Route path={`${path}/ptt`}>
        <LoginPage userType="ptt" />
      </Route>
      <Route path={`${path}/non-ptt`}>
        <LoginPage userType="non-ptt" />
      </Route>
      <Route path={`${path}/activate-account`}>
        <ActivateAccountPage />
      </Route>
      <Route path={`${path}/reset-password`}>
        <RenewPasswordPage />
      </Route>
      <Route path={`${path}/forget-password`}>
        <ForgetPasswordPage />
      </Route>
    </Switch>
  );
};

export default AnonymousRoute;
