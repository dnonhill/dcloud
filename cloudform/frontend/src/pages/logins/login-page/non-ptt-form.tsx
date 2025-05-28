import { Button, Control, Field, Icon, Label } from 'bloomer';
import { Form, Formik, FormikHelpers } from 'formik';
import * as React from 'react';
import { Link } from 'react-router-dom';
import * as Yup from 'yup';

import { ErrorMessage, Input } from '../../../components/formik';
import { LoginProperties } from './model';

interface FormProps {
  onSubmit: (values: LoginProperties, action: FormikHelpers<LoginProperties>) => void;
  initialValues?: LoginProperties;
}

const initValues: LoginProperties = {
  domain: undefined,
  username: '',
  password: '',
};

export const schema = Yup.object().shape({
  username: Yup.string().required(),
  password: Yup.string().required(),
});

const NonPttLoginForm: React.FC<FormProps> = (props) => (
  <Formik
    initialValues={props.initialValues || initValues}
    validationSchema={schema}
    validateOnBlur={false}
    onSubmit={props.onSubmit}
  >
    {({ isSubmitting }) => (
      <Form className="frm-login">
        <Field>
          <Label>Email address</Label>
          <Control hasIcons>
            <Input name="username" />
            <Icon isAlign="left" className="fas fa-envelope" />
          </Control>
          <ErrorMessage name="username" />
        </Field>

        <Field>
          <Label>Password</Label>
          <Control hasIcons>
            <Input type="password" name="password" />
            <Icon isAlign="left" className="fa fa-lock" />
          </Control>
          <p className="help has-text-right">
            <Link to="forget-password">Forget password</Link>
          </p>
          <ErrorMessage name="password" />
        </Field>

        <Field>
          <Button type="submit" value="Login" isColor="primary" isFullWidth disabled={isSubmitting}>
            Login
          </Button>
        </Field>
      </Form>
    )}
  </Formik>
);

export default NonPttLoginForm;
