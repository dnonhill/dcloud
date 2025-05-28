import { Select } from 'bloomer';
import { Select as SelectProps } from 'bloomer/lib/elements/Form/Select';
import { Field, FieldConfig, FieldProps } from 'formik';
import * as React from 'react';

type FieldInputConfig = Pick<FieldConfig, 'validate'>;

export type FormikInputProps = SelectProps<HTMLSelectElement> &
  FieldInputConfig & {
    isFullwidth?: boolean;
  };

function FormikSelect(props: FormikInputProps) {
  const { name, validate, isFullwidth, ...selectProps } = props;

  return (
    <Field name={name} validate={validate}>
      {({ field }: FieldProps) => {
        return <Select {...field} className={isFullwidth ? 'is-fullwidth' : ''} {...selectProps} />;
      }}
    </Field>
  );
}

export { FormikSelect };
