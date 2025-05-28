import * as React from 'react';
import { useDispatch } from 'react-redux';
import { Redirect, Route, Switch, useLocation, useRouteMatch } from 'react-router';

import userApi, { User } from '../../api/user';
import { AppHeader, AppTitle, ContentWrapper, DeferRender } from '../../components';
import ChangePasswordPage from './change-password';
import { ProfileContext } from './context';
import EditProfilePage from './edit';
import ProfileInfo from './info';

const ProfileComponent: React.FC<{ user: User }> = ({ user }) => {
  const match = useRouteMatch()!;
  return (
    <ProfileContext.Provider value={user}>
      <AppHeader>
        <AppTitle>{user.fullname || user.username}</AppTitle>
      </AppHeader>
      <ContentWrapper>
        <Switch>
          <Route path={`${match.path}/info`} component={ProfileInfo} />
          {user.isLocal && <Route path={`${match.path}/edit`} component={EditProfilePage} />}
          {user.isLocal && <Route path={`${match.path}/change-password`} component={ChangePasswordPage} />}
          <Redirect path={`${match.path}`} to={`${match.path}/info`} />
        </Switch>
      </ContentWrapper>
    </ProfileContext.Provider>
  );
};

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const search = new URLSearchParams(location.search);

  const reloadFlag = !!search.get('reload');

  const profileLoader = React.useMemo(async () => {
    return await userApi(dispatch).profile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, reloadFlag]);

  return <DeferRender promise={profileLoader} render={(user) => <ProfileComponent user={user} />} />;
};

export default ProfilePage;
