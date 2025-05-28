import { cleanup, fireEvent, render } from '@testing-library/react';
import { Formik } from 'formik';
import * as React from 'react';

import { FormikInput } from './input';

interface Model {
  value: number;
}

function createElement() {
  return render(
    <div>
      <Formik initialValues={{ value: 5 }} onSubmit={() => {}}>
        <FormikInput name="value" type="number" />
      </Formik>
    </div>,
  );
}

it('Render input as formik context', () => {
  const { container } = createElement();

  const inputEl = container.querySelector('input');
  expect(inputEl).not.toBeNull();
  expect(inputEl!.value).toEqual('5');

  inputEl && fireEvent.change(inputEl, { target: { value: '10' } });
  expect(inputEl!.value).toEqual('10');
});

afterEach(cleanup);
