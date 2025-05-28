import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import _ from 'lodash';

export function camelToSnake(obj: object, converter = _.snakeCase): object {
  const callback = _.rearg(converter, 1);
  return _.isArray(obj) ? mapArray(obj, callback) : mapKeysDeep(obj, callback);
}

export function snakeToCamel(obj: object): object {
  const callback = _.rearg(_.camelCase, 1);
  return _.isArray(obj) ? mapArray(obj, callback) : mapKeysDeep(obj, callback);
}

function mapKeysDeep(obj: object, cb: (value: any, key: any) => any): object {
  return _.mapValues(_.mapKeys(obj, cb), (val: any) =>
    _.isDate(val) ? val : _.isArray(val) ? mapArray(val, cb) : _.isObject(val) ? mapKeysDeep(val, cb) : val,
  );
}

function mapArray(arr: any[], cb: (value: any, key: any) => any): any {
  return arr.map((val) =>
    _.isDate(val) ? val : _.isObject(val) ? mapKeysDeep(val, cb) : _.isArray(val) ? mapArray(val, cb) : val,
  );
}

function buildFormData(obj: any): FormData {
  const formData = new FormData();
  Object.entries(obj).forEach(([key, val]) => {
    const data = val instanceof Blob || typeof val === 'string' ? val : _.toString(val);
    formData.append(_.snakeCase(key), data);
  });

  return formData;
}

export function convertCamelizedParamsToSnake(config: AxiosRequestConfig) {
  const preserveDoubleUnderScoreSnakeCase = (text: string) => {
    return text.split('__').map(_.snakeCase).join('__');
  };
  if (config.params) {
    config.params = camelToSnake(config.params, preserveDoubleUnderScoreSnakeCase);
  }
  return config;
}

export function convertCamelizedBodyToSnake(config: AxiosRequestConfig) {
  const preservedBody = 'preservedBody' in config && (config as any).preservedBody;
  const preservedRequestBody = 'preservedRequestBody' in config && (config as any).preservedRequestBody;

  if (config.data && !preservedBody && !preservedRequestBody) {
    if (config.headers['Content-Type'] === 'multipart/form-data') {
      config.data = buildFormData(config.data);
    } else {
      config.data = camelToSnake(config.data);
    }
  }
  return config;
}

export function convertSnakeBodyToCamel(response: AxiosResponse | any) {
  const preservedBody = 'preservedBody' in response.config && response.config.preservedBody;
  const preservedResponseBody = 'preservedResponseBody' in response.config && response.config.preservedResponseBody;

  if (response.data && !preservedBody && !preservedResponseBody) response.data = snakeToCamel(response.data);
  return response;
}

export function handleErrorResponse(error: any) {
  if (error && error.response && error.response.data) error.response.data = snakeToCamel(error.response.data);
  return Promise.reject(error);
}

export default (axiosInstance: AxiosInstance) => {
  axiosInstance.interceptors.request.use(convertCamelizedBodyToSnake);
  axiosInstance.interceptors.request.use(convertCamelizedParamsToSnake);
  axiosInstance.interceptors.response.use(convertSnakeBodyToCamel, handleErrorResponse);
  return axiosInstance;
};
