import { Button, Control, Field, Icon, Label, Title } from 'bloomer';
import { Form, Formik, FormikHelpers } from 'formik';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router';
import * as Yup from 'yup';

import userApi from '../../api/user';
import { BackButton, ErrorBox } from '../../components';
import { ErrorMessage, Input } from '../../components/formik';
import { enqueue } from '../../redux/snackbar';
import AnonymousPageLayout from './anonymous-page-layout';

interface ForgetPasswordModel {
  username: string;
}

const ForgetPasswordSchema = Yup.object().shape({
  username: Yup.string().required().email(),
});

interface ForgetPasswordFormProps {
  onSubmit: (values: ForgetPasswordModel, actions: FormikHelpers<ForgetPasswordModel>) => void;
}

const ForgetPasswordForm: React.FC<ForgetPasswordFormProps> = (props) => (
  <Formik initialValues={{ username: '' }} validationSchema={ForgetPasswordSchema} onSubmit={props.onSubmit}>
    <Form>
      <Field>
        <Label>Enter your Email address</Label>
        <Control hasIcons>
          <Input name="username" placeholder="Email address" />
          <Icon isAlign="left" className="fas fa-envelope" />
        </Control>
        <ErrorMessage name="username" />
      </Field>
      <Field isGrouped>
        <Control>
          <Button type="submit" value="forgetPassword" isColor="primary">
            Reset
          </Button>
        </Control>
        <Control>
          <BackButton>Back</BackButton>
        </Control>
      </Field>
    </Form>
  </Formik>
);

const ForgetPasswordPage: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const [error, setError] = React.useState('');

  const onResetPassword = async (values: ForgetPasswordModel, actions: FormikHelpers<ForgetPasswordModel>) => {
    try {
      await userApi(dispatch).forgetPassword(values.username);
      dispatch(enqueue('Reset password link is sent to your email.', 'success'));
      history.push('/login/non-ptt');
    } catch (err) {
      let errorMessage = err.message;
      if (err.statusCode === 404) errorMessage = 'Your Email is not in available.';

      setError(errorMessage);
      actions.setSubmitting(false);
    }
  };

  return (
    <AnonymousPageLayout>
      <Title>Forget password?</Title>
      <ErrorBox>{error}</ErrorBox>
      <ForgetPasswordForm onSubmit={onResetPassword} />
    </AnonymousPageLayout>
  );
};

export default ForgetPasswordPage;
