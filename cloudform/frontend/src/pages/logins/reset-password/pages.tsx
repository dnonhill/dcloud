import { Title } from 'bloomer';
import * as React from 'react';

import AnonymousPageLayout from '../anonymous-page-layout';
import ResetPasswordFormContainer from './form';

const ActivateAccountPage: React.FC = () => {
  return (
    <AnonymousPageLayout>
      <Title>Activate your account</Title>
      <ResetPasswordFormContainer successMessage="Your account has been activated. Please login again." />
    </AnonymousPageLayout>
  );
};

const RenewPasswordPage: React.FC = () => {
  return (
    <AnonymousPageLayout>
      <Title>Reset your password</Title>
      <ResetPasswordFormContainer successMessage="Your password has been reset. Please login again." />
    </AnonymousPageLayout>
  );
};

export { ActivateAccountPage, RenewPasswordPage };
