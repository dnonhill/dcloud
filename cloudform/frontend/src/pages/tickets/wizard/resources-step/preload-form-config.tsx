import * as React from 'react';
import { useDispatch } from 'react-redux';

import formConfigApi, { FormConfigSet } from '../../../../api/form-config';

export interface FormConfig {
  vm: FormConfigSet;
  container: FormConfigSet;
}

export const FormConfigContext = React.createContext<FormConfig>({
  vm: {},
  container: {},
});

export function useVmFormContext() {
  const allConfigs = React.useContext(FormConfigContext);
  return allConfigs.vm;
}

export function useContainerContext() {
  const allConfigs = React.useContext(FormConfigContext);
  return allConfigs.container;
}

export const PreloadFormConfig: React.FC = (props) => {
  const dispatch = useDispatch();
  const [formConfig, setFormConfig] = React.useState<FormConfig>({ vm: {}, container: {} });

  React.useEffect(() => {
    const api = formConfigApi(dispatch);
    let isDone = false;

    api
      .listByPage('vm-request-form')
      .then((resp) => {
        if (!isDone) {
          setFormConfig((current) => ({
            ...current,
            vm: resp,
          }));
        }
      })
      .catch((err) => console.error('Failed to load form config vm-request-form', err));

    api
      .listByPage('openshift-request-form')
      .then((resp) => {
        if (!isDone) {
          setFormConfig((current) => ({
            ...current,
            container: resp,
          }));
        }
      })
      .catch((err) => console.error('Failed to load form config openshift-request-form', err));

    return () => {
      isDone = true;
    };
  }, [dispatch]);

  return <FormConfigContext.Provider value={formConfig}>{props.children}</FormConfigContext.Provider>;
};
