import { Dispatch } from 'redux';

import { apiPromise } from './promise';

export interface UserDomainProperty {
  name: string;
  displayName: string;
}

const userDomainApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);
  return {
    list: () => api<UserDomainProperty[]>({ url: 'userdomain/' }),
  };
};

export default userDomainApi;
