import { Form, Formik } from 'formik';
import * as React from 'react';

import { RESOURCE_TYPE_CONTAINER } from '../../resource-type';
import PricingPanel from '../pricing/pricing';
import { defaultValues, ResourceSection } from '../tickets/wizard/resources-step/form/container';
import { FormProps } from '../tickets/wizard/resources-step/form/types';

const ContainerPriceForm: React.FC<FormProps> = (props) => {
  const { initialValues = defaultValues, onSubmit } = props;

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {(props) => (
        <Form>
          <div className="is-divider" data-content="Resource quota" />
          <ResourceSection {...props} />
          <PricingPanel item={{ resourceType: RESOURCE_TYPE_CONTAINER, specification: props.values }} />
        </Form>
      )}
    </Formik>
  );
};

export default ContainerPriceForm;
