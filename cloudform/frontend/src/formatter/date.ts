import { DateTime } from 'luxon';

export const displayDate = (value: string) => DateTime.fromISO(value).toFormat('dd MMM, yyyy');

export const displayDateTime = (value: string) => DateTime.fromISO(value).toFormat('dd MMM, yyyy HH:mm');

export const displayRelativeDate = (value: string) => DateTime.fromISO(value).toRelative();

export const displayJSDate = (value: Date) => DateTime.fromJSDate(value).toFormat('dd MMM, yyyy');

export const displayJSDateFile = (value: Date) => DateTime.fromJSDate(value).toFormat('ddMMyyyy');
