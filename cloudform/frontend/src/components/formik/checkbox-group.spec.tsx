import { cleanup, fireEvent, render } from '@testing-library/react';
import { Formik } from 'formik';
import * as React from 'react';

import { FormikCheckboxGroup } from './checkbox-group';

const choices = {
  'Option 1': 1,
  'Option 2': 2,
  'Option 3': 3,
};

interface Model {
  values: number[];
}
const initModel = { values: [1] };

function createElement() {
  return render(
    <div>
      <Formik initialValues={initModel} onSubmit={() => {}}>
        {({ values }) => {
          return (
            <>
              <span id="values">{values.values.join(',')}</span>
              <FormikCheckboxGroup name="values" choices={choices} />
            </>
          );
        }}
      </Formik>
    </div>,
  );
}

it('Render checkbox as given choices', () => {
  const { container } = createElement();

  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  expect(checkboxes).toHaveLength(3);

  checkboxes.forEach((checkbox) => {
    const currentChoice = checkbox.getAttribute('name')!.slice('values'.length + 1);
    const selected = initModel.values.includes(parseInt(currentChoice));
    expect(checkbox.hasAttribute('checked')).toEqual(selected);
  });

  const values = container.querySelector('#values');
  expect(values!.textContent).toEqual('1');
});

it('Trigger checkbox event should trigger handleChange', () => {
  const { container } = createElement();

  const choice3 = container.querySelector('input[name="values-3"]');
  expect(choice3).not.toBeNull();
  choice3 && fireEvent.click(choice3);

  const values = container.querySelector('#values');
  expect(values!.textContent).toEqual('1,3');
});

afterEach(cleanup);
