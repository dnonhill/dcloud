import * as React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router';

import { UserProfile } from '../../redux/auth';
import { ApplicationState } from '../../redux/state';

function isUserInGroup(user: UserProfile, groupName: string): boolean {
  return !!user.groups.find((group) => group.name === groupName);
}

const Home: React.FC<{ user: UserProfile }> = (props) => {
  const { user } = props;

  if (isUserInGroup(user, 'approver')) {
    return <Redirect to="/approvements" />;
  }

  if (isUserInGroup(user, 'cloudadmin')) {
    return <Redirect to="/assignments" />;
  }

  if (isUserInGroup(user, 'operator')) {
    return <Redirect to="/my-assignments" />;
  }

  if (isUserInGroup(user, 'requestor')) {
    return <Redirect to="/projects" />;
  }
  if (isUserInGroup(user, 'reviewer')) {
    return <Redirect to="/reviews" />;
  }

  return <Redirect to="/users/profile" />;
};

const HomePage: React.FC = () => {
  const user = useSelector<ApplicationState, UserProfile | undefined>((state) => state.auth.profile);
  if (!user) {
    return <Redirect to="/login" />;
  } else {
    return <Home user={user} />;
  }
};

export default HomePage;
export { Home };
