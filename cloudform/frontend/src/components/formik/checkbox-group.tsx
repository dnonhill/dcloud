import { useField } from 'formik';
import * as React from 'react';

import { CheckboxGroup } from '../checkbox-group';

interface FormikCheckboxGroupProps<V> {
  name: string;
  choices: { [displayName: string]: V };
  validate?: (value: V[]) => string | Promise<void> | undefined;
}

function FormikCheckboxGroup<V>(props: FormikCheckboxGroupProps<V>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [formikInput, _, formikHelper] = useField<V[]>({
    name: props.name,
    validate: props.validate,
  });

  return (
    <CheckboxGroup
      name={props.name}
      choices={props.choices}
      values={formikInput.value}
      onChange={(val) => formikHelper.setValue(val)}
    />
  );
}

export { FormikCheckboxGroup };
