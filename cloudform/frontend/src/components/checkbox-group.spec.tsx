import { cleanup, fireEvent, render } from '@testing-library/react';
import * as React from 'react';

import { CheckboxGroup } from './checkbox-group';

const choices = {
  'Option 1': 1,
  'Option 2': 2,
  'Option 3': 3,
};

const initialValues = [1];

function createElement() {
  const Wrapper = () => {
    const [values, setValues] = React.useState<number[]>(initialValues);
    return (
      <div>
        <span id="values">{values.join(',')}</span>
        <CheckboxGroup
          name="options"
          choices={choices}
          onChange={(val) => {
            setValues(val);
          }}
          values={values}
        />
      </div>
    );
  };
  return render(<Wrapper />);
}

it('Render checkbox as given choices', () => {
  const { container } = createElement();

  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  expect(checkboxes).toHaveLength(3);

  checkboxes.forEach((checkbox) => {
    const currentChoice = checkbox.getAttribute('name')!.slice(8);
    const selected = initialValues.includes(parseInt(currentChoice));
    expect(checkbox.hasAttribute('checked')).toEqual(selected);
  });

  const values = container.querySelector('#values');
  expect(values!.textContent).toEqual('1');
});

it('Click on unchecked choice, should add the element', () => {
  const { container } = createElement();

  const choice3 = container.querySelector('input[name="options-3"]');
  expect(choice3).not.toBeNull();
  choice3 && fireEvent.click(choice3);

  const values = container.querySelector('#values');
  expect(values!.textContent).toEqual('1,3');
});

it('Click on checked choice, should deselect the element', () => {
  const { container } = createElement();

  const choice3 = container.querySelector('input[name="options-3"]');
  choice3 && fireEvent.click(choice3);

  const choice1 = container.querySelector('input[name="options-1"]');
  choice1 && fireEvent.click(choice1);

  const values = container.querySelector('#values');
  expect(values!.textContent).toEqual('3');
});

afterEach(cleanup);
