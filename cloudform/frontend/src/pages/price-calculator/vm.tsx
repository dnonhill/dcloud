import { Form, Formik } from 'formik';
import * as React from 'react';

import { Divider } from '../../components';
import PricingPanel from '../pricing/pricing';
import {
  initialValue,
  MachineSection,
  ProtectionSection,
  SoftwarePackageSection,
  StorageSection,
} from '../tickets/wizard/resources-step/form/vm';

const VmPriceForm: React.FC = (props) => {
  const isEditMode = false;

  return (
    <>
      <Formik initialValues={initialValue} onSubmit={() => {}}>
        {(props) => (
          <Form>
            <Divider dataContent="Machine Specification" />
            <MachineSection isEditMode={isEditMode} />

            <Divider dataContent="Storage" />
            <StorageSection {...props} isEditMode={isEditMode} />

            <Divider dataContent="Backup and Data recovery" />

            <ProtectionSection isEditMode={isEditMode} />

            <Divider dataContent="Software Package" />
            <SoftwarePackageSection {...props} />

            <PricingPanel item={{ resourceType: 'vm', specification: props.values }} />
          </Form>
        )}
      </Formik>
    </>
  );
};

export default VmPriceForm;
