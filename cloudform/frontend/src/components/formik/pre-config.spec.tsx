import { cleanup, fireEvent, render } from '@testing-library/react';
import { Formik } from 'formik';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import { FormConfig } from '../../api/form-config';
import { PreConfigRadio, PreConfigSelect } from './pre-config';

async function waitABit() {
  await new Promise((resolve) => setTimeout(resolve, 50));
}

describe('PreConfigSelect', () => {
  function createElement(config: FormConfig[], otherAttrs: any = {}) {
    return render(
      <Formik initialValues={{ value: '5', display: '55', ex1: '555', ex2: '5555' }} onSubmit={() => {}}>
        {({ values }) => {
          return (
            <>
              <PreConfigSelect name="value" displayField="display" config={config} {...otherAttrs} />
              <span className="display">{values.display}</span>
              <span className="value">{values.value}</span>
              <span className="ex1">{values.ex1}</span>
              <span className="ex2">{values.ex2}</span>
            </>
          );
        }}
      </Formik>,
    );
  }

  it('Display change should change display field', async () => {
    const { container } = createElement([
      { value: '5', display: '55' },
      { value: '6', display: '66' },
    ]);

    const selectEl = container.querySelector('select');
    expect(selectEl).not.toBeNull();

    await act(async () => {
      selectEl && fireEvent.change(selectEl, { target: { value: '6' } });
    });
    await waitABit();

    const valueEl = container.querySelector('span.value');
    expect(valueEl!.textContent).toEqual('6');

    const displayEl = container.querySelector('span.display');
    expect(displayEl!.textContent).toEqual('66');
  });

  it('Initial with different display value', async () => {
    const { container } = createElement([
      { value: '5', display: '66' },
      { value: '6', display: '77' },
    ]);
    await act(async () => {
      await waitABit();
    });

    const selectEl = container.querySelector('select');
    expect(selectEl).not.toBeNull();

    const valueEl = container.querySelector('span.value');
    expect(valueEl!.textContent).toEqual('5');

    const displayEl = container.querySelector('span.display');
    expect(displayEl!.textContent).toEqual('66');
  });

  it('Extra fields', async () => {
    const { container } = createElement([
      { value: '5', display: '55', extraFields: { ex1: '555', ex2: '5555' } },
      { value: '6', display: '66', extraFields: { ex1: '666', ex2: '6666' } },
    ]);

    const selectEl = container.querySelector('select');
    expect(selectEl).not.toBeNull();

    await act(async () => {
      selectEl && fireEvent.change(selectEl, { target: { value: '6' } });
    });
    await waitABit();

    const ex1El = container.querySelector('span.ex1');
    expect(ex1El!.textContent).toEqual('666');

    const ex2El = container.querySelector('span.ex2');
    expect(ex2El!.textContent).toEqual('6666');
  });

  it('current value is unknown value', async () => {
    const { container } = createElement([
      { value: '4', display: '44', extraFields: { ex1: '444', ex2: '4444' } },
      { value: '6', display: '66', extraFields: { ex1: '666', ex2: '6666' } },
    ]);

    const selectEl = container.querySelector('select');
    expect(selectEl).not.toBeNull();
    await act(async () => {
      await waitABit();
    });

    const valueEl = container.querySelector('span.value');
    expect(valueEl!.textContent).toEqual('4');

    const displayEl = container.querySelector('span.display');
    expect(displayEl!.textContent).toEqual('44');

    const ex1El = container.querySelector('span.ex1');
    expect(ex1El!.textContent).toEqual('444');

    const ex2El = container.querySelector('span.ex2');
    expect(ex2El!.textContent).toEqual('4444');
  });

  it('current value is unknown value, but enable blank on unknown', async () => {
    const { container } = createElement(
      [
        { value: '4', display: '44', extraFields: { ex1: '444', ex2: '4444' } },
        { value: '6', display: '66', extraFields: { ex1: '666', ex2: '6666' } },
      ],
      { handleUnknown: 'set_blank' },
    );

    const selectEl = container.querySelector('select');
    expect(selectEl).not.toBeNull();
    await waitABit();

    const options = container.querySelectorAll('option');
    expect(options.length).toEqual(3);

    const valueEl = container.querySelector('span.value');
    expect(valueEl!.textContent).toEqual('');

    const displayEl = container.querySelector('span.display');
    expect(displayEl!.textContent).toEqual('');
  });

  it('Current value is unknown value, but enable add choice', async () => {
    const { container } = createElement(
      [
        { value: '4', display: '44', extraFields: { ex1: '444', ex2: '4444' } },
        { value: '6', display: '66', extraFields: { ex1: '666', ex2: '6666' } },
      ],
      { handleUnknown: 'add_choice' },
    );

    const selectEl = container.querySelector('select');
    expect(selectEl).not.toBeNull();
    await waitABit();

    const options = container.querySelectorAll('option');
    expect(options.length).toEqual(3);

    const valueEl = container.querySelector('span.value');
    expect(valueEl!.textContent).toEqual('5');

    const displayEl = container.querySelector('span.display');
    expect(displayEl!.textContent).toEqual('55');
  });
});

describe('PreConfigRadio', () => {
  function createElement(config: FormConfig[]) {
    return render(
      <Formik initialValues={{ value: '5', display: '55' }} onSubmit={() => {}}>
        {({ values }) => {
          return (
            <>
              <PreConfigRadio name="value" displayField="display" config={config} />
              <span className="display">{values.display}</span>
              <span className="value">{values.value}</span>
            </>
          );
        }}
      </Formik>,
    );
  }

  it('Display change should change display field', async () => {
    const { container } = createElement([
      { value: '5', display: '55' },
      { value: '6', display: '66' },
    ]);

    let valueEl = container.querySelector('span.value');
    expect(valueEl!.textContent).toEqual('5');

    const newRadioEl = container.querySelector('input[value="6"]');
    expect(newRadioEl).not.toBeNull();

    await act(async () => {
      newRadioEl && fireEvent.click(newRadioEl);
    });
    await waitABit();

    const displayEl = container.querySelector('span.display');
    expect(displayEl!.textContent).toEqual('66');

    valueEl = container.querySelector('span.value');
    expect(valueEl!.textContent).toEqual('6');
  });
});

afterEach(cleanup);
