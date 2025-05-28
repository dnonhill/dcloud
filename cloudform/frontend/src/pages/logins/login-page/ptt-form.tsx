import { Button, Control, Field, Icon, Label } from 'bloomer';
import { Form, Formik, FormikHelpers } from 'formik';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import * as Yup from 'yup';

import userDomainApi, { UserDomainProperty } from '../../../api/userdomain';
import { ErrorMessage, Input, Select } from '../../../components/formik';
import { LoginProperties } from './model';

interface FormProps {
  onSubmit: (values: LoginProperties, action: FormikHelpers<LoginProperties>) => void;
  initialValues?: LoginProperties;
  nonPttUserLink: string;
}

const initValues: LoginProperties = {
  domain: 'pttdigital',
  username: '',
  password: '',
};

export const schema = Yup.object().shape({
  domain: Yup.string().required(),
  username: Yup.string().required(),
  password: Yup.string().required(),
});

const PttLoginForm: React.FC<FormProps> = (props) => {
  const [userDomainList, setUserDomainList] = useState<UserDomainProperty[]>([]);
  const dispatch = useDispatch();

  useEffect(() => {
    userDomainApi(dispatch).list().then(setUserDomainList);
  }, [dispatch, setUserDomainList]);

  return (
    <Formik
      initialValues={props.initialValues || initValues}
      validationSchema={schema}
      validateOnBlur={false}
      onSubmit={props.onSubmit}
    >
      {({ isSubmitting, values }) => {
        return (
          <Form className="frm-login">
            <Field>
              <Label>Domain</Label>
              <Control>
                <Select name="domain" isFullwidth>
                  {userDomainList.map((item) => (
                    <option value={item.name} key={item.name}>
                      {item.displayName}
                    </option>
                  ))}
                </Select>
              </Control>
              <ErrorMessage name="domain" />
              <p className="has-text-right help">
                <Link to={props.nonPttUserLink}>I'm not in any domain here.</Link>
              </p>
            </Field>

            <Field>
              <Label>Username</Label>
              <Control hasIcons>
                <Input name="username" />
                <Icon isAlign="left" className="fa fa-user" />
              </Control>
              <ErrorMessage name="username" />
            </Field>

            <Field>
              <Label>Password</Label>
              <Control hasIcons>
                <Input type="password" name="password" />
                <Icon isAlign="left" className="fa fa-lock" />
              </Control>
              <ErrorMessage name="password" />
            </Field>

            <Field>
              <Button type="submit" value="Login" isColor="primary" isFullWidth disabled={isSubmitting}>
                Login
              </Button>
            </Field>
          </Form>
        );
      }}
    </Formik>
  );
};

export default PttLoginForm;
