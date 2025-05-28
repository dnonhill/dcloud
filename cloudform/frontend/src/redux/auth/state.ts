export interface AuthenticationAppState {
  auth?: AuthenticationState;
}

export interface UserGroup {
  id: number;
  name: string;
}

export interface UserProfile {
  id: number;
  username: string;
  fullname: string;
  firstName: string;
  lastName: string;
  email: string;
  groups: UserGroup[];
}

export interface AuthenticationState {
  isAuthenticating: boolean;
  error?: any;
  username?: string;
  access?: string;
  refresh?: string;
  profile?: UserProfile;
}
