import { LoginPayload } from '../../../redux/auth';

export type LoginProperties = Pick<LoginPayload, 'domain' | 'username' | 'password'>;
export type UserType = 'ptt' | 'non-ptt';
