import {
  Card,
  CardContent,
  CardFooter,
  CardFooterItem,
  CardHeader,
  CardHeaderIcon,
  CardHeaderTitle,
  Icon,
  Tag,
} from 'bloomer';
import * as React from 'react';

import { ResourceProperty } from '../../../../api/resource';
import { TicketItemRequest } from '../../../../api/ticket';
import { CollapsibleBox, CollapsibleBoxHeaderProps, CollapsibleIcon } from '../../../../components/collapsible-box';
import { EstimatedPrice } from '../../../pricing/pricing';
import { DetailContent, ResourceTypeIcon } from '../../../resources/content-extractor';
import { SpecificationContent, TicketItemName } from '../../resource-spec';

type TicketItemHeaderProps = {
  ticketItem: TicketItemRequest;
} & CollapsibleBoxHeaderProps;

const TicketItemHeader: React.FC<TicketItemHeaderProps> = (props) => (
  <CardHeader>
    <CardHeaderTitle className="has-text-primary" style={{ flexWrap: 'wrap' }}>
      <TicketItemName ticketItem={props.ticketItem} />
      <EstimatedPrice item={props.ticketItem} />
    </CardHeaderTitle>
    <CardHeaderIcon>
      <CollapsibleIcon isOpen={props.isOpen} />
    </CardHeaderIcon>
  </CardHeader>
);

interface TicketItemProps {
  ticketItem: TicketItemRequest;
  onEdit?: () => void;
  onDelete?: () => void;
}

const TicketItem: React.FC<TicketItemProps> = (props) => (
  <Card>
    <CollapsibleBox
      headerType={(headerProps) => <TicketItemHeader ticketItem={props.ticketItem} isOpen={headerProps.isOpen} />}
    >
      <CardContent>
        <SpecificationContent ticketItem={props.ticketItem} />
      </CardContent>
      <CardFooter>
        <CardFooterItem tag="a" onClick={() => props.onEdit && props.onEdit()}>
          <Icon className="fas fa-edit" />
          <span>Edit</span>
        </CardFooterItem>
        <CardFooterItem tag="a" onClick={() => props.onDelete && props.onDelete()}>
          <Icon className="fas fa-trash-alt" />
          <span>Delete</span>
        </CardFooterItem>
      </CardFooter>
    </CollapsibleBox>
  </Card>
);

type ResourceItemHeaderProps = {
  resource: ResourceProperty;
  ticketItem: TicketItemRequest | undefined;
} & CollapsibleBoxHeaderProps;

const ResourceItemHeader: React.FC<ResourceItemHeaderProps> = (props) => (
  <CardHeader>
    <CardHeaderTitle className="has-text-primary">
      <ResourceTypeIcon resourceType={props.resource.resourceType} />
      <span className="resource-name">{props.resource.name}</span>
      {props.ticketItem && <EstimatedPrice item={props.ticketItem} />}
    </CardHeaderTitle>
    <CardHeaderIcon>
      {props.ticketItem &&
        (props.ticketItem.action === 'update' ? (
          <Tag isColor="warning">UPDATE</Tag>
        ) : (
          <Tag isColor="danger">DELETE</Tag>
        ))}
      <CollapsibleIcon isOpen={props.isOpen} />
    </CardHeaderIcon>
  </CardHeader>
);

interface ResourceItemProps {
  resource: ResourceProperty;
  ticketItem: TicketItemRequest | undefined;
  onUpdateResource: () => void;
  onDismissResource: () => void;
  onEditItem: () => void;
  onDeleteItem: () => void;
}

const ResourceItem: React.FC<ResourceItemProps> = (props) => (
  <Card className="existing-resource">
    <CollapsibleBox
      headerType={(headerProps) => (
        <ResourceItemHeader resource={props.resource} ticketItem={props.ticketItem} isOpen={headerProps.isOpen} />
      )}
    >
      <CardContent>
        {props.ticketItem && props.ticketItem.action === 'update' ? (
          <SpecificationContent ticketItem={props.ticketItem} />
        ) : (
          <DetailContent resource={props.resource} />
        )}
      </CardContent>
      <CardFooter>
        {props.ticketItem ? (
          <>
            {props.ticketItem.action === 'update' && (
              <CardFooterItem tag="a" onClick={() => props.onEditItem()} data-action="edit-update">
                <Icon className="fas fa-edit" />
                <span>Edit specification</span>
              </CardFooterItem>
            )}
            <CardFooterItem tag="a" onClick={() => props.onDeleteItem()} data-action="revert-change">
              <Icon className="fas fa-history" />
              <span>Revert change</span>
            </CardFooterItem>
          </>
        ) : (
          <>
            <CardFooterItem tag="a" onClick={() => props.onUpdateResource()} data-action="update-resource">
              <Icon className="fas fa-marker" />
              <span>Update specification</span>
            </CardFooterItem>
            <CardFooterItem tag="a" onClick={() => props.onDismissResource()} data-action="dismiss-resource">
              <Icon className="fas fa-eraser" />
              <span>Dismiss resource</span>
            </CardFooterItem>
          </>
        )}
      </CardFooter>
    </CollapsibleBox>
  </Card>
);

export { TicketItem, ResourceItem };
