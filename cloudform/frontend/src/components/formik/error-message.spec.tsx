import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { Field, Formik } from 'formik';
import * as React from 'react';

import { FormikErrorMessage } from './error-message';

interface Model {
  value: number;
}

function createElement(validate: (val: Model) => object) {
  return render(
    <div>
      <Formik initialValues={{ value: 0 }} onSubmit={() => {}}>
        {({ submitForm, setErrors, values }) => {
          return (
            <>
              <Field type="number" name="value" />
              <FormikErrorMessage name="value" className="extra" />
              <button
                id="validate"
                onClick={() => {
                  setErrors(validate(values));
                  submitForm();
                }}
              >
                Validate
              </button>
            </>
          );
        }}
      </Formik>
    </div>,
  );
}

it('Show message when there are some error', () => {
  const { container } = createElement(() => {
    return { value: 'Error message' };
  });

  const submitButton = container.querySelector('button#validate');
  expect(submitButton).not.toBeNull();
  act(() => {
    submitButton && fireEvent.click(submitButton);
  });

  const errorEl = container.querySelector('p.help');
  expect(errorEl).not.toBeNull();
  expect(errorEl!.className).toContain('danger');
  expect(errorEl!.className).toContain('extra');

  expect(errorEl!.textContent).toEqual('Error message');
});

it('Hide message when there is no error', () => {
  const { container } = createElement(() => {
    return {};
  });

  const submitButton = container.querySelector('button#validate');
  expect(submitButton).not.toBeNull();
  act(() => {
    submitButton && fireEvent.click(submitButton);
  });

  const errorEl = container.querySelector('p.help');
  expect(errorEl).toBeNull();
});

afterEach(cleanup);
