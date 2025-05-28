import { Button, Control, Field, Label } from 'bloomer';
import { Form, Formik } from 'formik';
import _ from 'lodash';
import * as React from 'react';
import * as Yup from 'yup';

import { BackButton } from '../../../../components';
import { ErrorMessage, Input } from '../../../../components/formik';
import { ContainerResult, ResultFormProps } from './types';

const containerResultSchema = Yup.object().shape({
  namespace: Yup.string().label('Project name').required().min(3),
  projectUrl: Yup.string().label('Project URL').url('value should be URL').trim(),
});

const ContainerResultForm: React.FC<ResultFormProps> = (props) => {
  const { taskGroup } = props;
  const initialValues: ContainerResult = {
    namespace:
      taskGroup.ticketItem.resource && !_.isNumber(taskGroup.ticketItem.resource)
        ? taskGroup.ticketItem.resource.details.namespace
        : '',
    ...props.initialValues,
  };

  return (
    <Formik initialValues={initialValues} validationSchema={containerResultSchema} onSubmit={props.onSubmit}>
      {(_) => (
        <Form>
          <Field>
            <Label>Namespace</Label>
            <Input name="namespace" />
            <ErrorMessage name="namespace" />
          </Field>

          <Field>
            <Label>Project URL</Label>
            <Input name="projectUrl" />
            <ErrorMessage name="projectUrl" />
          </Field>

          <Field isGrouped>
            <Control>
              <Button type="submit" isColor="primary" data-action="save">
                Save
              </Button>
            </Control>
            <Control>
              <BackButton />
            </Control>
          </Field>
        </Form>
      )}
    </Formik>
  );
};

export default ContainerResultForm;
