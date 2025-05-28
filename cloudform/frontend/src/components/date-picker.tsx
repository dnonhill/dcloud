import { Input } from 'bloomer';
import { Input as InputProp } from 'bloomer/lib/elements/Form/Input';
import * as bulmaCalendar from 'bulma-calendar';
import * as React from 'react';

type DatePickerProps = InputProp<HTMLInputElement> & {
  date?: Date | null;
  dateFormat?: string;
  minDate?: Date;
  maxDate?: Date;
  onDateSelected?: (newDate: Date | string | null) => void;
  closeOnSelect?: boolean;
  closeOnOverlayClick?: boolean;
  isRange?: boolean;
  allowSameDayRange?: boolean;
  showFooter?: boolean;
  startTime?: string;
  endTime?: string;
  minuteSteps?: number;
  startDate?: Date;
  endDate?: Date;
  showClearButton?: boolean;
};

export enum DatePickerType {
  Date = 'date',
  DateTime = 'datetime',
  Time = 'time',
}

const DatePicker: React.FC<DatePickerProps> = (props) => {
  const {
    date = null,
    dateFormat = 'dd-MMM-yyyy',
    minDate,
    maxDate,
    onDateSelected,
    type = 'date',
    closeOnOverlayClick = true,
    closeOnSelect = true,
    isRange = false,
    allowSameDayRange = true,
    showFooter = true,
    startTime,
    endTime,
    startDate,
    endDate,
    minuteSteps = 5,
    showClearButton = false,
    ...inputProps
  } = props;
  const wrapperEl = React.useRef<HTMLDivElement>(null);
  const currentDate = React.useRef<Date | null | string>(date || null);
  const calendar = React.useRef<any>(null);

  React.useEffect(() => {
    if (wrapperEl.current) {
      const inputEl = wrapperEl.current.querySelector('input');

      if (!calendar.current) {
        const objDate = date && new Date(date);
        const _minDate = minDate && objDate && minDate.getTime() <= objDate.getTime() ? minDate : undefined;
        const _maxDate = maxDate && objDate && maxDate.getTime() >= objDate.getTime() ? maxDate : undefined;

        calendar.current = bulmaCalendar.attach(inputEl, {
          type,
          startTime,
          endTime,
          startDate,
          endDate,
          minDate: _minDate,
          maxDate: _maxDate,
          minuteSteps,
          dateFormat,
          lang: 'en',
          closeOnOverlayClick,
          closeOnSelect,
          isRange,
          showFooter,
          showClearButton,
        })[0];

        return () => {
          calendar.current.destroy();
          calendar.current = null;
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (calendar.current && onDateSelected) {
      const onSelect = () => {
        let newDate: Date | string;
        let crntDate: Date | string;
        const calendarType = calendar.current.options.type;

        if (calendarType === DatePickerType.Date || calendarType === DatePickerType.DateTime) {
          newDate = new Date(calendar.current.value());
          crntDate = new Date(currentDate.current || 0);
        } else {
          newDate = calendar.current.value();
          crntDate = currentDate.current || '';
        }

        if (crntDate !== newDate) {
          onDateSelected(newDate);
          currentDate.current = newDate;
          calendar.current.value(newDate);
        }
      };

      calendar.current.on('select', onSelect);
      return () => {
        calendar.current && calendar.current.removeEventListener(onSelect);
      };
    }
  }, [onDateSelected]);

  return (
    <span ref={wrapperEl}>
      <Input {...inputProps} />
    </span>
  );
};

export { DatePicker };
