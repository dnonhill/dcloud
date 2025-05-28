import { Checkbox, Control, Radio, Select } from 'bloomer';
import { Select as SelectProps } from 'bloomer/lib/elements/Form/Select';
import { FieldConfig, useField, useFormikContext } from 'formik';
import _ from 'lodash';
import * as React from 'react';

import { FormConfig } from '../../api/form-config';

type FieldInputConfig = Pick<FieldConfig, 'validate'>;
interface PreConfigProps {
  name: string;
  config: FormConfig[];
  displayField: string;
  handleUnknown?: 'select_first' | 'set_blank' | 'add_choice';
}

type PreConfigSelectProps = Omit<SelectProps<HTMLSelectElement>, 'name'> & FieldInputConfig & PreConfigProps;

function useExtraFieldEffect(
  currentFieldValue: string,
  valueField: string,
  displayField: string,
  config: FormConfig[],
) {
  const formContext = useFormikContext<any>();

  React.useEffect(() => {
    let selectedConf = config.find((conf) => conf.value === currentFieldValue);
    const displayValue = selectedConf ? selectedConf.display : undefined;

    if (_.isUndefined(selectedConf)) {
      if (config.length > 0) {
        selectedConf = config[0];
        formContext.setFieldValue(valueField, selectedConf.value);
      }
    }

    if (selectedConf && formContext.values[displayField] !== displayValue) {
      formContext.setFieldValue(displayField, displayValue);
      if (selectedConf.extraFields) {
        for (let key in selectedConf.extraFields) {
          formContext.setFieldValue(key, selectedConf.extraFields[key]);
        }
      }
    }
  }, [currentFieldValue, config]); //eslint-disable-line
}

function PreConfigSelect(props: PreConfigSelectProps) {
  const { name, validate, config: _config, displayField, handleUnknown = 'select_first', ...selectProps } = props;

  const [fieldInput, fieldMeta] = useField({ name, validate });
  const formContext = useFormikContext<any>();

  let config = _config;
  const isInitialValueExists =
    fieldMeta.initialValue === undefined || _config.find((conf) => conf.value === fieldMeta.initialValue);

  if (!isInitialValueExists) {
    if (handleUnknown == 'set_blank') {
      const blankValue: FormConfig = { value: '', display: '', extraFields: {} };
      config = [blankValue].concat(_config);
    } else if (handleUnknown == 'add_choice') {
      const newChoice: FormConfig = {
        value: fieldInput.value,
        display: formContext.values[displayField],
        extraFields: {},
      };
      config = _config.concat([newChoice]);
    }
  }

  useExtraFieldEffect(fieldInput.value, props.name, displayField, config);

  return (
    <Select {...fieldInput} {...selectProps}>
      {config.map((conf) => (
        <option value={conf.value} key={conf.value}>
          {conf.display}
        </option>
      ))}
    </Select>
  );
}

type PreConfigRadioProps = Omit<React.HTMLProps<HTMLElement>, 'name'> & FieldInputConfig & PreConfigProps;

function PreConfigRadio(props: PreConfigRadioProps) {
  const { name, validate, config, displayField, ...radioProps } = props;
  const [fieldInput, _, fieldHelper] = useField({ name, validate }); //eslint-disable-line @typescript-eslint/no-unused-vars
  const currentFieldValue = fieldInput.value;

  useExtraFieldEffect(currentFieldValue, props.name, displayField, config);

  return (
    <>
      {config.map((conf) => (
        <Control key={conf.value}>
          <Radio
            {...radioProps}
            {...fieldInput}
            checked={currentFieldValue === conf.value}
            onChange={() => fieldHelper.setValue(conf.value)}
            value={conf.value}
          >
            &nbsp;{conf.display}
          </Radio>
        </Control>
      ))}
    </>
  );
}

type PreConfigCheckBoxProps = Omit<React.HTMLProps<HTMLElement>, 'name'> &
  FieldInputConfig &
  Omit<PreConfigProps, 'displayField'>;

type CheckBoxValue = {
  display: string;
  value: string;
};

function PreConfigCheckBox(props: PreConfigCheckBoxProps) {
  const { name, validate, config } = props;
  const [fieldInput, _, fieldHelper] = useField({ name, validate });
  const currentFieldValue = fieldInput.value;

  const handleChange = (display: string, value: string) => {
    const newValues = currentFieldValue.some((field: CheckBoxValue) => field.value === value)
      ? currentFieldValue.filter((field: CheckBoxValue) => field.value !== value)
      : currentFieldValue.concat([{ display, value }]);
    fieldHelper.setValue(newValues);
  };

  return (
    <>
      {config.map(({ display, value }) => (
        <Control key={display}>
          <Checkbox
            name={`${name}-${value}`}
            checked={currentFieldValue.some((field: CheckBoxValue) => field.value === value)}
            onChange={() => handleChange(display, value)}
          >
            {' ' + display}
          </Checkbox>
        </Control>
      ))}
    </>
  );
}

export { PreConfigSelect, PreConfigRadio, PreConfigCheckBox };
