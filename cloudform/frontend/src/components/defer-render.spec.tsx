import { cleanup, render, waitFor } from '@testing-library/react';
import * as React from 'react';

import { DeferRender } from './defer-render';

const SampleComponent: React.FC<{ value: string }> = ({ value }) => (
  <span className="real-value" data-testid="real-value">
    {value}
  </span>
);

describe('WithLoading', () => {
  it('unresolved promise', async () => {
    const neverEnd = new Promise<{ value: string }>(() => {});
    const { queryByTestId } = render(
      <DeferRender promise={neverEnd} render={(value) => <SampleComponent {...value} />} />,
    );

    await waitFor(() => queryByTestId('loading'));
  });

  it('done promise', async () => {
    const delayDone = (async () => {
      return 'hello';
    })();
    const { queryByTestId } = render(
      <DeferRender promise={delayDone} render={(value) => <SampleComponent value={value} />} />,
    );
    await waitFor(() => queryByTestId('real-value'));
  });

  it('error promise', async () => {
    const delayError = (async () => {
      throw new Error('error');
    })();
    const { queryByTestId } = render(
      <DeferRender promise={delayError} render={(value) => <SampleComponent {...value} />} />,
    );

    await waitFor(() => queryByTestId('error'));
  });
  afterEach(cleanup);
});
