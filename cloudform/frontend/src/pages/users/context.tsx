import * as React from 'react';

import { User } from '../../api/user';

const ProfileContext = React.createContext<User>({
  fullname: '',
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  groups: [],
});

function useProfileContext() {
  return React.useContext(ProfileContext);
}

export { ProfileContext, useProfileContext };
