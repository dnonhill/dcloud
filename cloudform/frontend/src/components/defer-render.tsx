import { Icon, Subtitle, Title } from 'bloomer';
import * as React from 'react';

import { ReactComponent as ErrorIllustration } from '../asset/error.svg';
import { IllustratedPage } from './illustration';

interface DeferRenderProps<T> {
  promise: Promise<T>;
  render: (value: T) => JSX.Element;
}

const Loading: React.FC = () => (
  <div style={{ paddingTop: '10em' }} className="has-text-centered fadeIn animated slow" data-testid="loading">
    <Title isSize={5}>
      <Icon isSize="large" className="fas fa-spinner fa-pulse" />
      <span>Loading...</span>
    </Title>
  </div>
);

export const Error: React.FC = () => (
  <IllustratedPage data-testid="error">
    <ErrorIllustration />
    <Title>Service is not available.</Title>
    <Subtitle>We're sorry for you inconvenience</Subtitle>
  </IllustratedPage>
);

function DeferRender<T>({ promise, render }: DeferRenderProps<T>) {
  const [isLoading, setLoading] = React.useState(true);
  const [isError, setError] = React.useState(false);
  const [values, setValues] = React.useState<T>();

  React.useEffect(() => {
    let didCancel = false;

    setLoading(true);
    promise
      .then((v) => {
        if (!didCancel) {
          setLoading(false);
          setError(false);
          setValues(v);
        }
      })
      .catch(() => {
        if (!didCancel) {
          setLoading(false);
          setError(true);
        }
      });
    return () => {
      didCancel = true;
    };
  }, [promise]);

  if (isLoading) return <Loading />;
  if (isError) return <Error />;
  if (typeof values !== 'undefined') return render(values);
  return null;
}

export { DeferRender };
