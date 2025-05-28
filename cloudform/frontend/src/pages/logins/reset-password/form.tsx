import { Button, Control, Field, Icon, Label } from 'bloomer';
import { Form, Formik, FormikHelpers } from 'formik';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router';
import { Redirect, useLocation } from 'react-router';
import * as Yup from 'yup';

import userApi, { testStrongPassword } from '../../../api/user';
import { ErrorBox } from '../../../components';
import { ErrorMessage, Input } from '../../../components/formik';
import { enqueue } from '../../../redux/snackbar';

interface ResetPasswordModel {
  username: string;
  password: string;
  passwordConfirm: string;
}

const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .required()
    .min(8)
    .test('password-strength', 'Password should be contains characters as suggestion', testStrongPassword),
  passwordConfirm: Yup.string()
    .required()
    .label('Password confirm')
    .oneOf([Yup.ref('password')], 'Password confirm is not match with password'),
});

interface ResetPasswordFormProps {
  username: string;
  onSubmit: (values: ResetPasswordModel, actions: FormikHelpers<ResetPasswordModel>) => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = (props) => {
  const defaultValues: ResetPasswordModel = {
    username: props.username,
    password: '',
    passwordConfirm: '',
  };

  return (
    <Formik initialValues={defaultValues} onSubmit={props.onSubmit} validationSchema={ResetPasswordSchema}>
      <Form>
        <Field>
          <Label>Email Address</Label>
          <Control hasIcons>
            <Input readOnly name="username" />
            <Icon isAlign="left" className="fas fa-envelope" />
          </Control>
        </Field>

        <Field>
          <Label>New Password</Label>
          <Control hasIcons>
            <Input name="password" type="password" />
            <Icon isAlign="left" className="fa fa-lock" />
          </Control>
          <ErrorMessage name="password" />
        </Field>

        <Field>
          <Label>New Password confirm</Label>
          <Control hasIcons>
            <Input name="passwordConfirm" type="password" />
            <Icon isAlign="left" className="fa fa-lock" />
          </Control>
          <ErrorMessage name="passwordConfirm" />
        </Field>

        <Field>
          <div className="has-text-primary is-size-7">
            <span>Password should contain characters from 3 of the following 4 categories:</span>
            <ul style={{ listStyle: 'disc', paddingLeft: '20px' }}>
              <li>English uppercase characters (A through Z)</li>
              <li>English lowercase characters (a through z)</li>
              <li>Base 10 digits (0 through 9)</li>
              <li>Non-alphabetic characters (for example, !, $, #, %)</li>
            </ul>
          </div>
        </Field>

        <Field>
          <Button type="submit" value="resetPassword" isColor="primary" isFullWidth>
            Activate account
          </Button>
        </Field>
      </Form>
    </Formik>
  );
};

interface ResetPasswordFormContainerProps {
  successMessage: string;
}

const ResetPasswordFormContainer: React.FC<ResetPasswordFormContainerProps> = (props) => {
  const queryString = new URLSearchParams(useLocation().search);
  const username = queryString.get('email');
  const token = queryString.get('token');

  const dispatch = useDispatch();
  const history = useHistory();
  const [error, setError] = React.useState('');

  const onSubmit = async (values: ResetPasswordModel, actions: FormikHelpers<ResetPasswordModel>) => {
    try {
      await userApi(dispatch).resetPassword(username || '', token || '', values.password);
      history.push('/login/non-ptt');
      dispatch(enqueue(props.successMessage, 'success'));
    } catch (e) {
      actions.setSubmitting(false);
      setError(e.details || e.message);
    }
  };

  if (!username || !token) return <Redirect to="/login" />;
  else
    return (
      <>
        <ErrorBox>{error}</ErrorBox>
        <ResetPasswordForm username={username} onSubmit={onSubmit} />
      </>
    );
};

export default ResetPasswordFormContainer;
