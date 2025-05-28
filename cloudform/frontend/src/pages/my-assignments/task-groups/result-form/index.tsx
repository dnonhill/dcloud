import * as React from 'react';

import { RESOURCE_TYPE_CONTAINER, RESOURCE_TYPE_VM } from '../../../../resource-type';
import ContainerResultForm from './container';
import OtherResultForm from './other';
import { ResultFormProps } from './types';
import VmResultForm from './vm';

const ResultForm: React.FC<ResultFormProps> = (props) => {
  const resourceType = props.taskGroup.ticketItem.resourceType;

  switch (resourceType) {
    case RESOURCE_TYPE_VM:
      return <VmResultForm {...props} />;
    case RESOURCE_TYPE_CONTAINER:
      return <ContainerResultForm {...props} />;
    default:
      return <OtherResultForm onSubmit={props.onSubmit} />;
  }
};

export default ResultForm;
