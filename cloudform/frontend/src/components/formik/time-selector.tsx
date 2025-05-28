import './time-selector.scss';

import { Select } from 'bloomer';
import { Select as SelectProps } from 'bloomer/lib/elements/Form/Select';
import { Field, FieldConfig, FieldProps, useFormikContext } from 'formik';
import * as React from 'react';

function FormikTimeSelector(props: FieldConfig & SelectProps<HTMLSelectElement>) {
  const { name, validate, ...selectProps } = props;
  const { setFieldValue } = useFormikContext<any>();
  const convertNumberToTwoDegitString = (n: number) => (n >= 10 ? `${n}` : `0${n}`);

  return (
    <Field name={name} validate={validate}>
      {({ field }: FieldProps) => {
        const [hours, minutes] = field.value.split(':');
        return (
          <div className="time-selector">
            <Select
              {...selectProps}
              className="is-fullwidth"
              value={hours}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const h = e.target.value;
                setFieldValue(name, `${h}:${minutes}`);
              }}
            >
              {Array.from(Array(24).keys()).map((value) => (
                <option key={value} value={convertNumberToTwoDegitString(value)}>
                  {convertNumberToTwoDegitString(value)}
                </option>
              ))}
            </Select>
            &nbsp;&nbsp;<b>:</b>&nbsp;&nbsp;
            <Select
              {...selectProps}
              className="is-fullwidth"
              value={minutes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const m = e.target.value;
                setFieldValue(name, `${hours}:${m}`);
              }}
            >
              {Array.from(Array(60).keys()).map((value) => (
                <option key={value} value={convertNumberToTwoDegitString(value)}>
                  {convertNumberToTwoDegitString(value)}
                </option>
              ))}
            </Select>
          </div>
        );
      }}
    </Field>
  );
}

export { FormikTimeSelector };
