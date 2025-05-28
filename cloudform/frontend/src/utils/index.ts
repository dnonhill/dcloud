import _ from 'lodash';

export const everyValueIsEmpty = (values: any[]) => values.every((v: any) => _.isEmpty(v));

export const someValueIsNotEmpty = <T>(values: T, keys: Array<keyof T>) =>
  keys.some((k: keyof T) => !_.isEmpty(values[k]));
