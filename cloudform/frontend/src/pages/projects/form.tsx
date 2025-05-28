import { Button, Column, Control, Field, Label } from 'bloomer';
import { Columns } from 'bloomer/lib/grid/Columns';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import { DateTime } from 'luxon';
import React from 'react';
import { useHistory } from 'react-router';
import * as Yup from 'yup';

import { ProjectRequest } from '../../api/project';
import { DatePicker, ErrorMessage, Input } from '../../components/formik';

export type InnerProjectFormProps = FormikProps<ProjectRequest>;

const InnerProjectForm = (props: InnerProjectFormProps) => {
  const { isSubmitting } = props;
  const history = useHistory();

  const today = React.useMemo(() => DateTime.local().startOf('day').toJSDate(), []);

  return (
    <Form id="frm-project">
      <Field>
        <Label data-required>Job code</Label>
        <Input type="text" name="jobCode" />
        <ErrorMessage name="jobCode" />
      </Field>
      <Field>
        <Label data-required>Project name</Label>
        <Input type="text" name="name" />
        <ErrorMessage name="name" />
      </Field>

      <Columns>
        <Column isSize={2}>
          <Field>
            <Label>Go-live date</Label>
            <DatePicker name="goLiveDate" />
            <ErrorMessage name="goLiveDate" />
          </Field>
        </Column>
      </Columns>

      <Columns>
        <Column isSize={2}>
          <Field>
            <Label>Expired date</Label>
            <DatePicker name="expiredDate" minDate={today} />
            <ErrorMessage name="expiredDate" />
          </Field>
        </Column>
      </Columns>

      <Field isGrouped>
        <Control>
          <Button type="submit" isColor="primary" isLoading={isSubmitting} disabled={isSubmitting}>
            Save
          </Button>
        </Control>
        <Control>
          <Button className="is-text" onClick={history.goBack}>
            Cancel
          </Button>
        </Control>
      </Field>
    </Form>
  );
};

const today = () => DateTime.local().startOf('day');

const DEFAULT_PROJECT: ProjectRequest = {
  jobCode: '',
  name: '',
  expiredDate: today().plus({ year: 1 }).toJSDate(),
  goLiveDate: today().toJSDate(),
};

const projectSchema = Yup.object().shape({
  jobCode: Yup.string().label('Job code').required().matches(/\d+/, 'Job code should be number.').min(10).max(25),
  name: Yup.string().label('Name').required().min(5).max(255),
  goLiveDate: Yup.date().label('Go-live date').max(Yup.ref('expiredDate')),
  expiredDate: Yup.date().label('Expired date').min(today().toJSDate()),
});

interface ProjectFormProps {
  initialValues?: ProjectRequest;
  onSubmit: (values: ProjectRequest, actions: FormikHelpers<ProjectRequest>) => void;
}

const ProjectForm: React.FC<ProjectFormProps> = (props) => (
  <Formik
    initialValues={props.initialValues || DEFAULT_PROJECT}
    onSubmit={props.onSubmit}
    validationSchema={projectSchema}
  >
    {(formState) => <InnerProjectForm {...formState} />}
  </Formik>
);

export default ProjectForm;
export { projectSchema, InnerProjectForm };
