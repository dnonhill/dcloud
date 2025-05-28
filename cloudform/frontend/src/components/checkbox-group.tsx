import { Checkbox, Control } from 'bloomer';
import * as React from 'react';

interface CheckboxGroupProps<V> {
  name: string;
  choices: { [displayName: string]: V };
  values: V[];
  onChange: (values: V[]) => void;
}

function CheckboxGroup<V>(props: CheckboxGroupProps<V>) {
  const { values, onChange } = props;
  const handleChange = (newVal: V) => {
    const newValues = values.includes(newVal) ? values.filter((val) => val !== newVal) : values.concat([newVal]);
    onChange(newValues);
  };

  return (
    <>
      {Object.entries(props.choices).map(([displayName, value]) => (
        <Control key={displayName}>
          <Checkbox
            name={`${props.name}-${value}`}
            checked={values.includes(value)}
            onChange={() => handleChange(value)}
          >
            {' ' + displayName}
          </Checkbox>
        </Control>
      ))}
    </>
  );
}

export { CheckboxGroup };
