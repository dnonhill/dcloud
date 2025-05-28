import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router';

import pricingApi from '../../../../api/pricing';
import { TicketItemRequestWithPseudoId } from '../../../../api/ticket';
import { ApplicationState } from '../../../../redux/state';
import { editItem, updatePrice } from '../../../../redux/ticket-wizard';
import ResourceForm from './form';

const EditItemPage: React.FC<{ successUrl: string }> = ({ successUrl }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { index: indexString } = useParams();
  const index = Number(indexString);

  const item = useSelector<ApplicationState, TicketItemRequestWithPseudoId>((state) => {
    return state!.ticketWizard.ticket!.items.find((item) => item.pseudoId === index)!;
  });

  const onSubmit = React.useCallback(
    (spec: any) => {
      if (!item) return;

      const editedItem = { ...item, specification: spec };
      dispatch(editItem(index, editedItem));

      const api = pricingApi(dispatch);
      api
        .calculate({ resourceType: editedItem.resourceType, specification: spec })
        .then((data) => dispatch(updatePrice(editedItem.pseudoId, data.price, data.priceDetail)));

      history.push(successUrl);
    },
    [dispatch, history, successUrl, index, item],
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
