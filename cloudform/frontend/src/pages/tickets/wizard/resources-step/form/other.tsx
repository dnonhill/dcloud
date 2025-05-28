import { Button, Control, Field, Label, Title } from 'bloomer';
import { Form, Formik } from 'formik';
import * as React from 'react';
import * as Yup from 'yup';

import { BackButton } from '../../../../../components';
import { ErrorMessage, TextArea } from '../../../../../components/formik';
import FocusError from '../../../../../components/formik/error-focus';
import { OtherSpecification } from '../../../resource-spec';
import { FormProps } from './types';

const otherRequestSchema = Yup.object().shape({
  message: Yup.string().required().min(5).max(255),
});

const defaultValues: OtherSpecification = {
  message: '',
};

const OtherForm: React.FC<FormProps> = (props) => {
  const { initialValues = defaultValues, onSubmit } = props;

  return (
    <>
      <Title isSize={5}>Special request</Title>
      <Formik initialValues={initialValues} validationSchema={otherRequestSchema} onSubmit={onSubmit}>
        {() => (
          <Form>
            <Field>
              <Label>Let me know your request</Label>
              <TextArea name="message" />
              <ErrorMessage name="message" />
            </Field>

            <Field isGrouped>
              <Control>
                <Button type="submit" data-action="save" isColor="primary">
                  Save
                </Button>
              </Control>
              <Control>
                <BackButton />
              </Control>
            </Field>
            <br />
            <FocusError />
          </Form>
        )}
      </Formik>
    </>
  );
};

export default OtherForm;
