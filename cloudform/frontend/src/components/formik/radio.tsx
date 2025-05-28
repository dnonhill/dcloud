import { Radio } from 'bloomer';
import { Field, FieldConfig, FieldProps } from 'formik';
import * as React from 'react';

type FieldInputConfig = Pick<FieldConfig, 'validate' | 'name'>;

export type FormikRadioProps<V> = Omit<React.HTMLProps<HTMLElement>, ''> & FieldInputConfig;

function FormikRadio<V>(props: FormikRadioProps<V>) {
  const { name, validate, value, ...radioProps } = props;

  return (
    <Field name={name} validate={validate} type="radio" value={value}>
      {({ field, form }: FieldProps) => {
        return <Radio {...radioProps} {...field} />;
      }}
    </Field>
  );
}

export { FormikRadio };
