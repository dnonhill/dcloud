import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router';

import pricingApi from '../../../../api/pricing';
import { ResourceProperty } from '../../../../api/resource';
import { ApplicationState } from '../../../../redux/state';
import { addItem } from '../../../../redux/ticket-wizard';
import ResourceForm from './form';

const UpdateResourcePage: React.FC<{ successUrl: string }> = ({ successUrl }) => {
  const dispatch = useDispatch();
  const history = useHistory();

  const { resourceId } = useParams();
  const paramResource = parseInt(resourceId || '0');
  const resource = useSelector<ApplicationState, ResourceProperty>((state) => {
    const resources = state!.ticketWizard.resources;
    return resources.find((resource) => resource.id === paramResource)!;
  });

  const onSubmit = React.useCallback(
    (spec: any) => {
      const api = pricingApi(dispatch);
      api.calculate({ resourceType: resource.resourceType, specification: spec }).then((data) =>
        dispatch(
          addItem({
            action: 'update',
            resourceType: resource.resourceType,
            resource: resource.id,
            specification: spec,
            estimatedPrice: data.price,
            priceDetail: data.priceDetail,
            pseudoId: new Date().getTime(),
          }),
        ),
      );
      history.push(successUrl);
    },
    [dispatch, history, successUrl, resource],
  );

  return (
    <ResourceForm
      onSubmit={onSubmit}
      mode="edit"
      resourceType={resource.resourceType}
      initialValues={resource.details}
    />
  );
};

export default UpdateResourcePage;
