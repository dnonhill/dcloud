import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router';

import pricingApi, { CalculatePriceResponse } from '../../api/pricing';
import { TicketItemRequestWithPseudoId } from '../../api/ticket';
import ResourceForm from '../tickets/wizard/resources-step/form';

const useTypeAsQueryParam = (): string => {
  const queryParam = new URLSearchParams(useLocation().search);
  const resourceType = queryParam.get('type');

  return resourceType || 'other';
};

interface NewItemPageProps {
  successUrl: string;
  items: TicketItemRequestWithPseudoId[];
  setItems: any;
}

const NewItemPage: React.FC<NewItemPageProps> = ({ successUrl, items, setItems }) => {
  const resourceType = useTypeAsQueryParam();
  const dispatch = useDispatch();
  const history = useHistory();

  const onSubmit = (spec: any) => {
    const transformedSpec = { ...spec };
    if (transformedSpec.database) {
      transformedSpec.database = {
        engine: transformedSpec.database.engine,
        detail: transformedSpec.databaseDetails,
      };
      delete transformedSpec.databaseDetails;
    }

    const pseudoId = new Date().getTime();
    const api = pricingApi(dispatch);
    api.calculate({ resourceType, specification: spec }).then((data: CalculatePriceResponse) => {
      setItems([
        ...items,
        {
          action: '',
          resourceType: resourceType,
          specification: transformedSpec,
          pseudoId: pseudoId,
          estimatedPrice: data.price,
          priceDetail: data.priceDetail,
        },
      ]);
    });

    history.push(successUrl);
  };

  return <ResourceForm onSubmit={onSubmit} mode="create" resourceType={resourceType} />;
};

export default NewItemPage;
