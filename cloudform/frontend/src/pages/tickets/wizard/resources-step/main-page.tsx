import { Button, Control, Field, Title } from 'bloomer';
import _ from 'lodash';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router';

import { ResourceProperty } from '../../../../api/resource';
import { TicketItemRequestWithPseudoId } from '../../../../api/ticket';
import { Divider } from '../../../../components';
import { ApplicationState } from '../../../../redux/state';
import { addItem, removeItem, TicketWizardState } from '../../../../redux/ticket-wizard';
import { TotalPricePanel } from '../../../pricing/pricing';
import AddResourcePanel from './new-resource-panel';
import { ResourceItem, TicketItem } from './ticket-items';

function filterNewResourceItems(items: TicketItemRequestWithPseudoId[]): TicketItemRequestWithPseudoId[] {
  return items.filter((item) => !item.resource);
}

function matchingResources(resources: ResourceProperty[], ticketItems: TicketItemRequestWithPseudoId[]) {
  return _.sortBy(resources, ['resourceType', 'name']).map((resource) => {
    const ticketItemIndex = ticketItems.findIndex((item) => resource.id === item.resource);
    return {
      resource: resource,
      ticketItem: ticketItems[ticketItemIndex],
    };
  });
}

interface MainResourcesStepProps {
  ticketItems: TicketItemRequestWithPseudoId[];
  resources: ResourceProperty[];
  onDeleteItem: (itemIndex: number) => void;
  onEditItem: (itemIndex: number) => void;
  onUpdateResource: (resourceId: number) => void;
  onDismissResource: (resourceId: number) => void;
  onNext: () => void;
}

const MainResourcesStep: React.FC<MainResourcesStepProps> = (props) => {
  const { ticketItems, resources } = props;
  const newResourceItems = React.useMemo(() => filterNewResourceItems(ticketItems), [ticketItems]);
  const resourceWithItems = React.useMemo(() => matchingResources(resources, ticketItems), [ticketItems, resources]);

  const isValid = ticketItems.length > 0;

  const updatedExistingResource = resourceWithItems
    .filter((resource) => resource?.ticketItem?.action === 'update')
    .map((resource) => resource?.ticketItem);

  const calcItems = [...newResourceItems, ...updatedExistingResource];

  return (
    <>
      <Title isSize={4}>Design resources</Title>
      {resourceWithItems.length > 0 && (
        <>
          <Divider dataContent="Existing Resources" />
          {resourceWithItems.map((matched) => (
            <ResourceItem
              resource={matched.resource}
              ticketItem={matched.ticketItem}
              onUpdateResource={() => props.onUpdateResource(matched.resource.id)}
              onDismissResource={() => props.onDismissResource(matched.resource.id)}
              onEditItem={() => props.onEditItem(matched.ticketItem ? matched.ticketItem.pseudoId : -1)}
              onDeleteItem={() => props.onDeleteItem(matched.ticketItem ? matched.ticketItem.pseudoId : -1)}
              key={matched.resource.id}
            />
          ))}
        </>
      )}
      <Divider dataContent="New Resources" />
      {newResourceItems.map((item) => (
        <TicketItem
          onEdit={() => props.onEditItem(item.pseudoId)}
          onDelete={() => props.onDeleteItem(item.pseudoId)}
          ticketItem={item}
          key={item.pseudoId}
        />
      ))}
      <br />
      <TotalPricePanel items={calcItems} />
      <br />
      <AddResourcePanel />
      <Field>
        <Control>
          <Button isColor="primary" data-action="proceed" disabled={!isValid} onClick={() => props.onNext()}>
            Next
          </Button>
        </Control>
      </Field>
    </>
  );
};

interface MainResourceStepPageProps {
  onNext: () => void;
}

const MainResourcesStepPage: React.FC<MainResourceStepPageProps> = (props) => {
  const { ticket, resources } = useSelector<ApplicationState, TicketWizardState>((state) => state.ticketWizard);
  const dispatch = useDispatch();

  const history = useHistory();
  const location = useLocation();

  if (!ticket) return null;

  const activeResources =
    ticket.dataCenter == null
      ? []
      : resources.filter((resource) => {
          return (
            resource.dataCenter &&
            resource.dataCenter.id === ticket.dataCenter!.id &&
            resource.jobCode === ticket!.jobCode
          );
        });

  const onEditItem = (itemIndex: number) => history.push(`${location.pathname}/${itemIndex}/edit`);
  const onDeleteItem = (itemIndex: number) => {
    const willDelete = window.confirm('Are you sure to delete the request?');
    if (willDelete) dispatch(removeItem(itemIndex));
  };

  const onUpdateResource = (resourceId: number) => {
    history.push(`${location.pathname}/new-update/${resourceId}`);
  };

  const onDismissResource = (resourceId: number) => {
    const dismissedResource = resources.find((r) => r.id === resourceId);
    if (!dismissedResource) return;
    dispatch(
      addItem({
        action: 'delete',
        resourceType: dismissedResource.resourceType,
        resource: resourceId,
        specification: {},
        pseudoId: new Date().getTime(),
      }),
    );
  };

  return (
    <MainResourcesStep
      ticketItems={ticket.items}
      resources={activeResources}
      onEditItem={onEditItem}
      onDeleteItem={onDeleteItem}
      onUpdateResource={onUpdateResource}
      onDismissResource={onDismissResource}
      onNext={props.onNext}
    />
  );
};

export default MainResourcesStepPage;
export { MainResourcesStep };
