import { Button, Control, Field, Label } from 'bloomer';
import { Form, Formik } from 'formik';
import * as React from 'react';
import * as Yup from 'yup';

import { BackButton } from '../../../../components';
import { ErrorMessage, TextArea } from '../../../../components/formik';
import { OtherRequestResult } from './types';

const otherResultSchema = Yup.object().shape({
  message: Yup.string().required().min(3),
});

const defaultValues: OtherRequestResult = {
  message: '',
};

const OtherResultForm: React.FC<{ onSubmit: (values: any) => void }> = ({ onSubmit }) => {
  return (
    <Formik initialValues={defaultValues} validationSchema={otherResultSchema} onSubmit={onSubmit}>
      {(_) => (
        <Form>
          <Field>
            <Label>Message</Label>
            <TextArea name="message" />
            <ErrorMessage name="message" />
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

export default OtherResultForm;
