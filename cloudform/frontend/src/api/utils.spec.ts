import * as apiUtils from './utils';

describe('isInvalidData', () => {
  it('Bad Request error', () => {
    expect(apiUtils.isInvalidData({ response: { status: 400 } })).toBe(true);
  });

  it('Other status response', () => {
    expect(apiUtils.isInvalidData({ response: { status: 500 } })).toBe(false);
  });

  it('Other error', () => {
    expect(apiUtils.isInvalidData(new Error())).toBe(false);
  });
});

describe('extractErrorMessage', () => {
  it('correct format error', () => {
    const originalError = {
      response: {
        data: {
          field1: ['error message 1'],
          field2: ['error message 2', 'optional error message '],
        },
      },
    };

    const extractedError = apiUtils.extractErrorMessage(originalError);

    expect(extractedError).toEqual({
      field1: 'error message 1',
      field2: 'error message 2',
    });
  });

  it('data contains non array message', () => {
    const originalError = {
      response: {
        data: {
          field1: 'error message 1',
          field2: ['error message 2', 'optional error message '],
        },
      },
    };

    const extractedError = apiUtils.extractErrorMessage(originalError);

    expect(extractedError).toEqual({
      field1: 'error message 1',
      field2: 'error message 2',
    });
  });

  it('data contains non array or string message', () => {
    const originalError = {
      response: {
        data: {
          field1: {},
          field2: ['error message 2', 'optional error message '],
        },
      },
    };

    const extractedError = apiUtils.extractErrorMessage(originalError);

    expect(extractedError).toEqual({
      field2: 'error message 2',
    });
  });

  it('blank data', () => {
    const originalError = {
      response: {
        data: null,
      },
    };

    const extractedError = apiUtils.extractErrorMessage(originalError);
    expect(extractedError).toEqual({});
  });

  it('no data', () => {
    const originalError = {
      response: {},
    };

    const extractedError = apiUtils.extractErrorMessage(originalError);
    expect(extractedError).toEqual({});
  });

  it('no response', () => {
    const originalError = {};

    const extractedError = apiUtils.extractErrorMessage(originalError);
    expect(extractedError).toEqual({});
  });
});
