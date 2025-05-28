import { FieldProps } from 'formik';
import React from 'react';
import Select, { OptionsType, Props, ValueType } from 'react-select';

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps extends FieldProps, Props {
  options: OptionsType<Option>;
  className?: string;
  placeholder?: string;
  autoSubmit?: boolean;
}

export const CustomSelect = ({
  className,
  placeholder,
  field,
  form,
  options,
  autoSubmit = true,
  isDisabled,
  isClearable,
  isMulti,
}: CustomSelectProps) => {
  const onChange = (option: ValueType<Option | Option[], false>) => {
    if (Array.isArray(option) && isMulti) {
      form.setFieldValue(field.name, option ? (option as Option[]).map((opt) => opt.value) : undefined);
    } else {
      form.setFieldValue(field.name, option ? (option as Option).value : undefined);
    }
    if (autoSubmit) {
      form.submitForm();
    }
  };

  const getValue = () => {
    if (options) {
      return options.find((option) => option.value === field.value);
    } else {
      return '' as any;
    }
  };

  return (
    <Select
      className={className}
      name={field.name}
      value={getValue()}
      onChange={onChange}
      placeholder={placeholder}
      options={options}
      isDisabled={isDisabled}
      isClearable={isClearable}
      isMulti={isMulti}
    />
  );
};

export default CustomSelect;
