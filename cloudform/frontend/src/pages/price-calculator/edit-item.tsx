import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router';

import pricingApi, { CalculatePriceResponse } from '../../api/pricing';
import { TicketItemRequestWithPseudoId } from '../../api/ticket';
import ResourceForm from '../tickets/wizard/resources-step/form';

interface EditItemPageProps {
  successUrl: string;
  items: TicketItemRequestWithPseudoId[];
  setItems: any;
}

const EditItemPage: React.FC<EditItemPageProps> = ({ successUrl, items, setItems }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { index: indexString } = useParams();
  const index = Number(indexString);

  const item = items.find((item) => item.pseudoId === index);

  const onSubmit = React.useCallback(
    (spec: any) => {
      if (!item) return;

      const transformedSpec = { ...spec };
      if (transformedSpec.database) {
        transformedSpec.database = {
          engine: transformedSpec.database.engine,
          detail: transformedSpec.databaseDetails,
        };
        delete transformedSpec.databaseDetails;
      }
      const editedItem = { ...item, specification: spec };

      const api = pricingApi(dispatch);
      api
        .calculate({ resourceType: editedItem.resourceType, specification: spec })
        .then((data: CalculatePriceResponse) => {
          const newItems = items.map((item) => {
            if (item.pseudoId === index) {
              return {
                ...item,
                estimatedPrice: data.price,
                priceDetail: data.priceDetail,
                specification: transformedSpec,
              };
            }
            return item;
          });
          setItems(newItems);
        });

      history.push(successUrl);
    },
    [item, dispatch, history, successUrl, items, setItems, index],
  );

  if (!item) {
    return null;
  }

  return (
    <ResourceForm
      onSubmit={onSubmit}
      mode={item.resource ? 'edit' : 'create'}
      resourceType={item.resourceType}
      initialValues={item.specification}
    />
  );
};

export default EditItemPage;
