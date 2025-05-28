import { Field, FieldConfig, FieldProps } from 'formik';
import * as React from 'react';

export type FormikFileInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> &
  Pick<FieldConfig, 'validate' | 'name'>;

function FormikFileInput(props: FormikFileInputProps) {
  const { name, validate, ...inputProps } = props;

  return (
    <Field name={name} validate={validate}>
      {({ field, form }: FieldProps) => {
        const { onChange: _, value: fieldValue, ...fieldProps } = field;
        const onChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
          ev.currentTarget.files && form.setFieldValue(name, ev.currentTarget.files[0]);
        };

        return <input {...fieldProps} {...inputProps} type="file" onChange={onChange} />;
      }}
    </Field>
  );
}

export { FormikFileInput };
