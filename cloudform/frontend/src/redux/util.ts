export function hasError<T>(payload: T | Error): payload is Error {
  return payload instanceof Error;
}

export function noError<T>(payload: T | Error): payload is T {
  return !hasError(payload);
}
