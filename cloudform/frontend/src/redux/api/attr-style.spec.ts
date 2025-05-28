import { camelToSnake, snakeToCamel } from './attr-style';

describe('camelToSnake', () => {
  it('should convert camel case to snake case', () => {
    const original = { camelCase: 'should be snake case' };
    expect(camelToSnake(original)).toEqual({
      camel_case: 'should be snake case',
    });
  });

  it('should convert nested object to snake case as well', () => {
    const original = {
      camelCase: 'should be snake case',
      wrapperObject: { camelCaseToo: 'should be snake case too' },
      arrayObject: [{ camelCaseOfArray: 'array too' }, { camelCaseOfArray: 'array too' }],
    };

    expect(camelToSnake(original)).toEqual({
      camel_case: 'should be snake case',
      wrapper_object: { camel_case_too: 'should be snake case too' },
      array_object: [{ camel_case_of_array: 'array too' }, { camel_case_of_array: 'array too' }],
    });
  });
});

describe('snakeToCamel', () => {
  it('should convert snake case to camel case', () => {
    const original = {
      snake_case: 'Should be camel case',
    };

    expect(snakeToCamel(original)).toEqual({
      snakeCase: 'Should be camel case',
    });
  });

  it('should convert inner object to camel case as well', () => {
    const original = {
      snake_case: 'Should be camel case',
      wrapper_object: { snake_case_too: 1 },
      array_objects: ['snake_case', { snake_case: 'hello' }],
    };

    expect(snakeToCamel(original)).toEqual({
      snakeCase: 'Should be camel case',
      wrapperObject: { snakeCaseToo: 1 },
      arrayObjects: ['snake_case', { snakeCase: 'hello' }],
    });
  });
});
