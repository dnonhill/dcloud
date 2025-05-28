import { Button, Control, Field, Label, Title } from 'bloomer';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import * as React from 'react';
import * as Yup from 'yup';

import { ApplicationRequest } from '../../api/application';
import { BackButton } from '../../components';
import { ErrorMessage, FileInput, Input, TextArea } from '../../components/formik';

export type InnerApplicationFormProps = {
  mode?: 'create' | 'edit';
};

const InnerApplicationForm = (props: FormikProps<ApplicationRequest> & InnerApplicationFormProps) => {
  const { isSubmitting } = props;

  return (
    <Form id="frm-application">
      <Title isSize={5}>Application Information</Title>
      <Field>
        <Label data-required>Name</Label>
        <Input type="text" name="name" />
        <ErrorMessage name="name" />
      </Field>
      <Field>
        <Label data-required>Description</Label>
        <TextArea type="text" name="description" />
        <ErrorMessage name="description" />
      </Field>
      <Field>
        <Label>System Diagram</Label>
        <FileInput name="systemDiagram" />
        <ErrorMessage name="systemDiagram" />
      </Field>

      <hr />
      <Title isSize={5}>Application supporter</Title>
      <Field>
        <Label data-required>Name</Label>
        <Input type="text" name="supporterName" />
        <ErrorMessage name="supporterName" />
      </Field>
      <Field>
        <Label data-required>Email address</Label>
        <Input type="email" name="supporterEmail" />
        <ErrorMessage name="supporterEmail" />
      </Field>
      <Field>
        <Label data-required>Department</Label>
        <Input type="text" name="supporterDepartment" />
        <ErrorMessage name="supporterDepartment" />
      </Field>
      <Field>
        <Label data-required>Organization</Label>
        <Input type="text" name="supporterOrganization" />
        <ErrorMessage name="supporterOrganization" />
      </Field>
      <hr />
      <Field isGrouped>
        <Control>
          <Button type="submit" isColor="primary" isLoading={isSubmitting} disabled={isSubmitting}>
            Save
          </Button>
        </Control>
        <Control>
          <BackButton />
        </Control>
      </Field>
    </Form>
  );
};

export type ApplicationFormProps = {
  application?: ApplicationRequest;
  projectId?: number;
  onSubmit: (values: ApplicationRequest, meta: FormikHelpers<ApplicationRequest>) => void;
} & InnerApplicationFormProps;

const applicationSchema = Yup.object().shape({
  name: Yup.string().label('Name').required().min(5).max(255),
  description: Yup.string().required().label('Description').min(10).max(255),
  supporterName: Yup.string().label('Application supporter name').required().min(5).max(255),
  supporterEmail: Yup.string().label('Application supporter eMail').email().required().min(5).max(255),
  supporterDepartment: Yup.string().label('Application supporter department').required().min(4).max(255),
  supporterOrganization: Yup.string().label('Application supporter organization').required().min(4).max(255),
});

const ApplicationForm: React.FC<ApplicationFormProps> = (props) => (
  <Formik
    initialValues={
      props.application || {
        name: '',
        description: '',
        project: props.projectId || 0,
        supporterName: '',
        supporterEmail: '',
        supporterDepartment: '',
        supporterOrganization: '',
        systemDiagram: '',
      }
    }
    onSubmit={props.onSubmit}
    validationSchema={applicationSchema}
  >
    {(formState) => <InnerApplicationForm mode={props.mode} {...formState} />}
  </Formik>
);

export default ApplicationForm;
export { InnerApplicationForm, applicationSchema };
