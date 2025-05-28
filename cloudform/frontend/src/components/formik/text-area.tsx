import { TextArea } from 'bloomer';
import { TextArea as TextAreaProps } from 'bloomer/lib/elements/Form/TextArea';
import { Field, FieldConfig, FieldProps } from 'formik';
import * as React from 'react';

type FieldInputConfig = Pick<FieldConfig, 'validate'>;

export type FormikTextAreaProps<V> = TextAreaProps<HTMLTextAreaElement> & FieldInputConfig;

function FormikTextArea<V>(props: FormikTextAreaProps<V>) {
  const { name, validate, ...inputProps } = props;

  return (
    <Field name={name} validate={validate}>
      {({ field }: FieldProps) => {
        return <TextArea {...field} {...inputProps}></TextArea>;
      }}
    </Field>
  );
}

export { FormikTextArea };
