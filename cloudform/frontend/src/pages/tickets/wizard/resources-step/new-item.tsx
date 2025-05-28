import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router';

import pricingApi from '../../../../api/pricing';
import { addItem, updatePrice } from '../../../../redux/ticket-wizard';
import ResourceForm from './form';

const useTypeAsQueryParam = (): string => {
  const queryParam = new URLSearchParams(useLocation().search);
  const resourceType = queryParam.get('type');

  return resourceType || 'other';
};

const NewItemPage: React.FC<{ successUrl: string }> = ({ successUrl }) => {
  const resourceType = useTypeAsQueryParam();
  const dispatch = useDispatch();
  const history = useHistory();

  const onSubmit = React.useCallback(
    (spec: any) => {
      const pseudoId = new Date().getTime();
      dispatch(
        addItem({
          action: 'create',
          resourceType: resourceType,
          specification: spec,
          pseudoId: pseudoId,
        }),
      );
      const api = pricingApi(dispatch);
      api
        .calculate({ resourceType, specification: spec })
        .then((data) => dispatch(updatePrice(pseudoId, data.price, data.priceDetail)));

      history.push(successUrl);
    },
    [dispatch, history, successUrl, resourceType],
  );

  return <ResourceForm onSubmit={onSubmit} mode="create" resourceType={resourceType} />;
};

export default NewItemPage;
