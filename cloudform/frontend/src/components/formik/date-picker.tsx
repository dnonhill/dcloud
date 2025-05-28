import { Input as InputProp } from 'bloomer/lib/elements/Form/Input';
import { useFormikContext } from 'formik';
import * as React from 'react';

import { DatePicker, DatePickerType } from '../date-picker';

type FormikDatePickerProps = Omit<InputProp<HTMLInputElement>, 'name'> & {
  name: string;
  dateFormat?: string;
  minDate?: Date;
  maxDate?: Date;
  validate?: (value: Date) => string | Promise<void> | undefined;
  formBilling?: boolean;
  type?: string;
  closeOnSelect?: boolean;
  closeOnOverlayClick?: boolean;
  showFooter?: boolean;
  isRange?: boolean;
  allowSameDayRange?: boolean;
  showClearButton?: boolean;
  minuteSteps?: number;
};

const FormikDatePicker: React.FC<FormikDatePickerProps> = (props) => {
  const { name, validate, formBilling } = props;
  const formikContext = useFormikContext();
  const formikInput = React.useMemo(() => formikContext.getFieldProps({ name, validate }), [
    formikContext,
    name,
    validate,
  ]);

  const setValue = formikContext.setFieldValue;

  const onDateSelected = React.useMemo(() => {
    return (val: Date | string | null) => {
      setValue(name, val);
      if (formBilling) {
        formikContext.submitForm();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formBilling, name, setValue]);

  const datePickerOptionsByType =
    props.type === DatePickerType.Time
      ? { startTime: formikInput.value || undefined }
      : { startDate: formikInput.value ? new Date(formikInput.value) : new Date() };

  return (
    <DatePicker
      name={props.name}
      type={props.type}
      date={formikInput.value}
      onDateSelected={onDateSelected}
      onBlur={formikInput.onBlur}
      minDate={props.minDate}
      maxDate={props.maxDate}
      dateFormat={props.dateFormat}
      closeOnSelect={props.closeOnSelect}
      closeOnOverlayClick={props.closeOnOverlayClick}
      isRange={props.isRange}
      allowSameDayRange={props.allowSameDayRange}
      showFooter={props.showFooter}
      showClearButton={props.showClearButton}
      minuteSteps={props.minuteSteps}
      {...datePickerOptionsByType}
    />
  );
};

export { FormikDatePicker };
