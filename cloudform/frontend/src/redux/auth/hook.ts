import { useSelector } from 'react-redux';

import { ApplicationState } from '../state';
import { UserProfile } from './state';

export function useUserProfile() {
  return useSelector<ApplicationState, UserProfile | undefined>((state) => state.auth.profile);
}

export function useUserInGroup(groupName: string) {
  const user = useUserProfile();
  return user && user.groups && !!user.groups.find((g) => g.name === groupName);
}
