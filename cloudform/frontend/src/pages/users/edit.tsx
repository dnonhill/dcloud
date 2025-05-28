import { Button, Control, Field, Label } from 'bloomer';
import { Form, Formik } from 'formik';
import { FormikHelpers } from 'formik/dist/types';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router';
import * as Yup from 'yup';

import userApi, { EditProfileRequest } from '../../api/user';
import { Divider } from '../../components';
import { ErrorMessage, Input } from '../../components/formik';
import { compactDetails } from '../../redux/api/error';
import { enqueue } from '../../redux/snackbar';
import { useProfileContext } from './context';

interface EditProfileFormProps {
  initValues: EditProfileRequest;
  onSubmit: (values: EditProfileRequest, actions: FormikHelpers<EditProfileRequest>) => void;
  onCancel: () => void;
}

const userSchema = Yup.object().shape({
  firstName: Yup.string().label('First name').required().min(5).max(100),
  lastName: Yup.string().label('Last name').required().min(5).max(100),
  mobile: Yup.string().label('Mobile').required().length(10).matches(/d*/, 'Only number is allowed'),
  telephone: Yup.string().label('Telephone').notRequired().nullable().min(9).max(20),
  department: Yup.string().label('Department').nullable().max(100),
  organization: Yup.string().label('Organization').nullable().max(100),
  company: Yup.string().label('Company').required().min(5).max(100),
});

const EditProfileForm: React.FC<EditProfileFormProps> = (props) => {
  return (
    <Formik initialValues={props.initValues} validationSchema={userSchema} onSubmit={props.onSubmit}>
      {(formProps) => (
        <Form>
          <Field>
            <Label>First name</Label>
            <Control>
              <Input name="firstName" />
            </Control>
            <ErrorMessage name="firstName" />
          </Field>
          <Field>
            <Label>Last name</Label>
            <Control>
              <Input name="lastName" />
            </Control>
            <ErrorMessage name="lastName" />
          </Field>

          <Divider dataContent="Contact" />
          <Field>
            <Label>Mobile</Label>
            <Control>
              <Input name="mobile" />
            </Control>
            <ErrorMessage name="mobile" />
          </Field>
          <Field>
            <Label>Telephone</Label>
            <Control>
              <Input name="telephone" />
            </Control>
            <ErrorMessage name="telephone" />
          </Field>

          <Divider dataContent="Organization" />
          <Field>
            <Label>Department</Label>
            <Control>
              <Input name="department" />
            </Control>
            <ErrorMessage name="department" />
          </Field>
          <Field>
            <Label>Organization</Label>
            <Control>
              <Input name="organization" />
            </Control>
            <ErrorMessage name="organization" />
          </Field>
          <Field>
            <Label>Company</Label>
            <Control>
              <Input name="company" />
            </Control>
            <ErrorMessage name="company" />
          </Field>

          <Field isGrouped>
            <Control>
              <Button isColor="primary" type="submit" isLoading={formProps.isSubmitting}>
                Save
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

const EditProfilePage: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const currentUser = useProfileContext();

  const onSubmit = async (values: EditProfileRequest, actions: FormikHelpers<EditProfileRequest>) => {
    try {
      await userApi(dispatch).editProfile(values);
      history.push('info?reload=true');
      dispatch(enqueue('Your profile has been updated.', 'success'));
    } catch (err) {
      dispatch(enqueue(err.message, 'danger'));
      actions.setErrors(compactDetails(err.details));
      actions.setSubmitting(false);
    }
  };

  const onCancel = () => {
    history.push('info');
  };

  return <EditProfileForm initValues={currentUser} onSubmit={onSubmit} onCancel={onCancel} />;
};

export default EditProfilePage;
export { EditProfileForm };
