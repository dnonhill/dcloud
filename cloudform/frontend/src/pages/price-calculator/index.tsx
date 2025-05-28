import { Column, Columns, Title } from 'bloomer';
import React, { ReactNode } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { TicketItemRequestWithPseudoId } from '../../api/ticket';
import { Divider } from '../../components';
import { RESOURCE_TYPE_CONTAINER, RESOURCE_TYPE_VM } from '../../resource-type';
import { TotalPricePanel } from '../pricing/pricing';
import { NewResourceButton } from '../tickets/wizard/resources-step/new-resource-panel';
import { TicketItem } from '../tickets/wizard/resources-step/ticket-items';

interface PriceCalculatorProps {
  children?: ReactNode;
  items: TicketItemRequestWithPseudoId[];
  setItems: any;
}

const PriceCalculator: React.FC<PriceCalculatorProps> = (props: PriceCalculatorProps) => {
  const { items, setItems } = props;
  const history = useHistory();
  const location = useLocation();
  const pathname = location.pathname;

  const onEditItem = (itemIndex: number) => history.push(`${location.pathname}/${itemIndex}/edit`);
  const onDeleteItem = (itemIndex: number) => {
    const willDelete = window.confirm('Are you sure to delete the request?');
    if (willDelete) {
      setItems(items.filter((item) => item.pseudoId !== itemIndex));
    }
  };

  return (
    <div>
      <Title isSize={4}>Price Calculator</Title>
      <Divider dataContent="New Resources" />
      {items.map((item) => (
        <TicketItem
          onEdit={() => onEditItem(item.pseudoId)}
          onDelete={() => onDeleteItem(item.pseudoId)}
          ticketItem={item}
          key={item.pseudoId}
        />
      ))}
      <br />
      <TotalPricePanel items={items} />
      <br />
      <>
        <Title isSize={6}>Add more instance</Title>
        <Columns isDesktop>
          <Column>
            <NewResourceButton
              url={`${pathname}/new?type=${RESOURCE_TYPE_VM}`}
              icon="fas fa-server"
              title="Virtual machine"
              field="vm"
              description="High quality virtual machine with care free 7x24 support."
            />
          </Column>
          <Column>
            <NewResourceButton
              url={`${pathname}/new?type=${RESOURCE_TYPE_CONTAINER}`}
              icon="fas fa-cloud"
              title="Openshift project"
              field="container-cluster"
              description="Build, deploy and mange your application on container platform."
            />
          </Column>
        </Columns>
      </>
    </div>
  );
};

export default PriceCalculator;
