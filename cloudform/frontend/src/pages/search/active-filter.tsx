import { Checkbox, Label } from 'bloomer';
import { FieldHookConfig, useField } from 'formik';
import * as React from 'react';

const ActiveFilter: React.FC<FieldHookConfig<string>> = ({ children, ...props }) => {
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [field, _, helper] = useField({ ...props, type: 'checkbox' });
  const handleChange = () => {
    helper.setValue(field.value === 'all' ? 'active' : 'all');
  };

  return (
    <Label>
      <Checkbox {...field} checked={field.value === 'all'} onChange={handleChange} />
      &nbsp;<span>Show archived</span>
    </Label>
  );
};

export default ActiveFilter;
