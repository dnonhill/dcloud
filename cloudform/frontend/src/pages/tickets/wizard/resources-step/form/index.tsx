import * as React from 'react';
import { useLocation } from 'react-router-dom';

import { RESOURCE_TYPE_CONTAINER, RESOURCE_TYPE_VM } from '../../../../../resource-type';
import ContainerForm from './container';
import OtherForm from './other';
import { FormProps } from './types';
import VmForm from './vm';

type ResourceFormProps = FormProps & {
  resourceType: string;
  mode?: 'edit' | 'create';
};

const ResourceForm: React.FC<ResourceFormProps> = (props) => {
  const { resourceType, mode = 'create', ...formProps } = props;
  const [isPriceCalculator, setIsPriceCalculator] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    const pathname = location.pathname;
    setIsPriceCalculator(pathname.includes('price-calculator') ? true : false);
  }, [location]);

  switch (resourceType) {
    case RESOURCE_TYPE_VM:
      return <VmForm {...formProps} mode={mode} isPriceCalculator={isPriceCalculator} />;
    case RESOURCE_TYPE_CONTAINER:
      return <ContainerForm {...formProps} mode={mode} isPriceCalculator={isPriceCalculator} />;
    default:
      return <OtherForm {...formProps} mode={mode} />;
  }
};

export default ResourceForm;
