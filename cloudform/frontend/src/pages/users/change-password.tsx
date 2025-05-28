import { Button, Control, Field, Label } from 'bloomer';
import { Form, Formik, FormikHelpers } from 'formik';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router';
import * as Yup from 'yup';

import userApi, { testStrongPassword } from '../../api/user';
import { ErrorMessage, Input } from '../../components/formik';
import { compactDetails } from '../../redux/api/error';
import { enqueue } from '../../redux/snackbar';

interface ChangePasswordState {
  oldPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

const changePasswordSchema = Yup.object().shape({
  oldPassword: Yup.string().label('Old password').required(),
  newPassword: Yup.string()
    .label('New password')
    .required()
    .min(8)
    .test('password-strength', 'Password should be contains characters as suggestion', testStrongPassword),
  newPasswordConfirm: Yup.string()
    .required()
    .label('New password confirm')
    .oneOf([Yup.ref('newPassword')], 'Password confirm is not match with password'),
});

interface ChangePasswordFormProps {
  onSubmit: (values: ChangePasswordState, actions: FormikHelpers<ChangePasswordState>) => void;
  onCancel: () => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = (props) => {
  const initValue: ChangePasswordState = {
    oldPassword: '',
    newPassword: '',
    newPasswordConfirm: '',
  };

  return (
    <Formik initialValues={initValue} onSubmit={props.onSubmit} validationSchema={changePasswordSchema}>
      {(formProps) => (
        <Form>
          <Field>
            <Label>Old password</Label>
            <Control>
              <Input name="oldPassword" type="password" />
            </Control>
            <ErrorMessage name="oldPassword" />
          </Field>
          <Field>
            <Label>New password</Label>
            <Control>
              <Input name="newPassword" type="password" />
            </Control>
            <ErrorMessage name="newPassword" />
          </Field>
          <Field>
            <Label>New password (confirm)</Label>
            <Control>
              <Input name="newPasswordConfirm" type="password" />
            </Control>
            <ErrorMessage name="newPasswordConfirm" />
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
          <Field isGrouped>
            <Control>
              <Button type="submit" isColor="primary">
                Change password
              </Button>
            </Control>
            <Control>
              <Button onClick={props.onCancel}>Cancel</Button>
            </Control>
          </Field>
        </Form>
      )}
    </Formik>
  );
};

const ChangePasswordPage: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  const onSubmit = async (values: ChangePasswordState, actions: FormikHelpers<ChangePasswordState>) => {
    try {
      await userApi(dispatch).changePassword(values.oldPassword, values.newPassword);
      history.push('info');
      dispatch(enqueue('Your password has been changed.', 'success'));
    } catch (err) {
      dispatch(enqueue(err.message, 'danger'));
      actions.setErrors(compactDetails(err.details));
      actions.setSubmitting(false);
    }
  };

  const onCancel = () => {
    history.push('info');
  };

  return <ChangePasswordForm onSubmit={onSubmit} onCancel={onCancel} />;
};

export default ChangePasswordPage;
export { ChangePasswordForm };
