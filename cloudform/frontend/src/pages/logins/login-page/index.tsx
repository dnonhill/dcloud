import '../asset/style.css';

import * as React from 'react';

import AnonymousPageLayout from '../anonymous-page-layout';
import LoginForm from './form-container';
import { UserType } from './model';

const LoginPage: React.FC<{ userType: UserType }> = (props) => (
  <AnonymousPageLayout>
    <LoginForm {...props} />
  </AnonymousPageLayout>
);

export default LoginPage;
