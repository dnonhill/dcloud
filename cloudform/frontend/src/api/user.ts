import { Dispatch } from 'redux';

import { logout } from '../redux/auth';
import { apiPromise } from './promise';

interface GroupProperty {
  id: number;
  name: string;
}

export type Group = Pick<GroupProperty, 'id' | 'name'>;
export const GROUP_CLOUD_ADMIN = 'cloudadmin';
export const GROUP_OPERATOR = 'operator';

export interface UserProperty {
  id?: number;
  fullname: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  groups: Group[];

  mobile?: string;
  telephone?: string;
  department?: string;
  organization?: string;
  company?: string;

  isLocal?: boolean;
}

export type User = UserProperty;
export type BriefUser = Pick<User, 'id' | 'username' | 'fullname' | 'firstName' | 'lastName'>;
export type ListUsers = {
  results: BriefUser[];
};

export type EditProfileRequest = Pick<
  User,
  'firstName' | 'lastName' | 'mobile' | 'telephone' | 'department' | 'organization' | 'company'
>;

export function testStrongPassword(password: string) {
  let count = 0;
  if (password.match(/[a-z]/)) count += 1;

  if (password.match(/[A-Z]/)) count += 1;

  if (password.match(/[0-9]/)) count += 1;

  if (password.match(/[!@#$%^&*(),.?":{}|<>]/)) count += 1;

  return count >= 3;
}

const userApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);
  return {
    listOperators: () =>
      api<ListUsers>({
        url: 'groups/operator/users/',
      }),

    profile: () =>
      api<User>({
        url: '/users/profile/',
      }),

    resetPassword: (username: string, token: string, password: string) => {
      dispatch(logout());
      return api({
        url: `/external-users/${username}/reset-password/`,
        method: 'POST',
        data: { token, password },
      });
    },

    forgetPassword: async (username: string) => {
      dispatch(logout());
      return api({
        url: `/external-users/${username}/forget-password/`,
        method: 'POST',
      });
    },

    editProfile: (newProfile: EditProfileRequest) => {
      return api({
        url: '/users/profile/edit/',
        method: 'POST',
        data: newProfile,
      });
    },

    changePassword: (oldPassword: string, newPassword: string) => {
      return api({
        url: '/users/profile/change-password/',
        method: 'POST',
        data: { oldPassword, newPassword },
      });
    },
  };
};

export default userApi;
