class ApiError {
  message: string;
  code: string | undefined = undefined;
  statusCode: number | undefined = undefined;
  details: { [key: string]: string[] } | undefined = undefined;

  constructor(error: any) {
    this.message = error.message ? error.message : '';

    if (error.response && error.response.data) {
      const data = error.response.data;

      this.message = data.message;
      this.code = data.code;
      this.statusCode = data.statusCode;
      this.details = data.details;
    }
  }
}

export function compactDetails(details: object) {
  if (!details) {
    return {};
  }
  return Object.entries(details).reduce(
    (acc, [key, value]) => ({ ...acc, [key]: Array.isArray(value) ? value[0] : value }),
    {},
  );
}

export default ApiError;
