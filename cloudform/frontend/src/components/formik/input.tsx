import { Input } from 'bloomer';
import { Input as InputProp } from 'bloomer/lib/elements/Form/Input';
import { Field, FieldConfig, FieldProps } from 'formik';
import * as React from 'react';

type FieldInputConfig = Pick<FieldConfig, 'validate'>;

export type FormikInputProps<V> = InputProp<HTMLInputElement> & FieldInputConfig;

function FormikInput<V>(props: FormikInputProps<V>) {
  const { name, validate, ...inputProps } = props;

  return (
    <Field name={name} validate={validate}>
      {({ field }: FieldProps) => {
        return <Input {...field} {...inputProps}></Input>;
      }}
    </Field>
  );
}

export { FormikInput };
