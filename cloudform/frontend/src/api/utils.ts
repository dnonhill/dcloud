export function isInvalidData(error: any): boolean {
  return 'response' in error && error.response && error.response.status === 400;
}

export function extractErrorMessage(error: any): any {
  if (!('response' in error)) return {};

  const message: { [key: string]: any } = {};
  for (let [key, value] of Object.entries(error.response.data || {})) {
    if (Array.isArray(value)) {
      message[key] = value[0];
    } else if (typeof value === 'string') {
      message[key] = value;
    }
  }

  return message;
}
