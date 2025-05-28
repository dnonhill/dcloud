import {
  Breadcrumb,
  BreadcrumbItem,
  Card,
  CardContent,
  CardHeader,
  CardHeaderIcon,
  CardHeaderTitle,
  Column,
  Columns,
  Icon,
  Notification,
  Tag,
} from 'bloomer';
import _ from 'lodash';
import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { ResourceProperty } from '../../api/resource';
import { ReviewBriefProperty } from '../../api/review';
import { TicketBriefResponse, TicketItemProperty, TicketResponse } from '../../api/ticket';
import {
  AppHeader,
  AppSubTitle,
  AppTitle,
  AttributeHeading,
  AttributeItem,
  AttributesBar,
  CollapsibleBox,
  CollapsibleIcon,
  CommentBox,
  ContentWrapper,
  LastUpdate,
  LinkButton,
  TitleEyebrow,
} from '../../components';
import { UserTooltip } from '../../components/user-tooltip';
import { settings } from '../../redux/auth/middleware';
import { RESOURCE_TYPE_OTHER } from '../../resource-type';
import { EstimatedPrice } from '../pricing/pricing';
import JobCodeModal from '../projects/modal';
import { STATUS_TEXT_MAP } from './formatter';
import { SpecificationContent, TicketItemName } from './resource-spec';
import TicketTimelineContainer from './timeline';

interface TicketItemHeaderProps {
  ticketItem: TicketItemProperty;
  resource?: ResourceProperty;
  isPlainText?: boolean;
}

const TicketItemHeader: React.FC<TicketItemHeaderProps> = ({ ticketItem, isPlainText, resource }) => {
  const action = ticketItem.action;
  return (
    <>
      {isPlainText ? (
        ticketItem.resourceType !== RESOURCE_TYPE_OTHER ? (
          <span className="ticket-item-action" style={{ marginRight: '0.5rem' }}>
            {_.capitalize(action)}
          </span>
        ) : null
      ) : (
        <Tag
          isColor={ticketItem.action === 'create' ? 'success' : ticketItem.action === 'update' ? 'warning' : 'danger'}
          className="is-light"
          style={{ marginRight: '0.5rem' }}
        >
          {action.toUpperCase()}
        </Tag>
      )}
      <TicketItemName ticketItem={ticketItem} isPlainText={isPlainText} resource={resource} />
    </>
  );
};

interface TicketItemDisplayProps {
  item: TicketItemProperty;
}

const TicketItemDisplay: React.FC<TicketItemDisplayProps> = (props) => {
  return (
    <Card>
      <CollapsibleBox
        headerType={({ isOpen }) => (
          <CardHeader>
            <CardHeaderTitle className="has-text-primary" style={{ flexWrap: 'wrap' }}>
              <TicketItemHeader ticketItem={props.item} />
              <EstimatedPrice item={props.item} />
            </CardHeaderTitle>
            <CardHeaderIcon>
              <CollapsibleIcon isOpen={isOpen} />
            </CardHeaderIcon>
          </CardHeader>
        )}
      >
        <CardContent>
          <SpecificationContent ticketItem={props.item} />
        </CardContent>
      </CollapsibleBox>
    </Card>
  );
};

interface WithTicket {
  ticket: TicketBriefResponse | TicketResponse;
}

const TicketHeader: React.FC<WithTicket & { isReadOnly: boolean }> = ({ ticket, isReadOnly }) => (
  <AppHeader>
    <TitleEyebrow>Ticket</TitleEyebrow>
    <AppTitle>{ticket.ticketNo}</AppTitle>
    <AppSubTitle>
      <Breadcrumb>
        <ul>
          <BreadcrumbItem>
            <Link
              to={`/projects/${ticket.project.id}` + (isReadOnly ? '?isReadOnly=true' : '')}
              className="has-text-info"
              data-field="project-name"
            >
              {ticket.project.name}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link
              to={`/applications/${ticket.application.id}` + (isReadOnly ? '?isReadOnly=true' : '')}
              className="has-text-info"
              data-field="application-name"
            >
              {ticket.application.name}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link to="#">Ticket</Link>
          </BreadcrumbItem>
        </ul>
      </Breadcrumb>
    </AppSubTitle>
  </AppHeader>
);

interface TicketAttributesProps extends WithTicket {
  openModal?: () => void;
}

const TicketAttributes: React.FC<TicketAttributesProps> = ({ ticket, openModal }) => (
  <AttributesBar>
    <AttributeItem>
      <AttributeHeading>STATUS</AttributeHeading>
      <p data-field="status" data-value={ticket.status}>
        {STATUS_TEXT_MAP[ticket.status]}
      </p>
    </AttributeItem>
    <AttributeItem>
      <AttributeHeading>Requestor</AttributeHeading>
      <UserTooltip user={ticket.createdBy} dataField="createdBy" />
    </AttributeItem>
    <AttributeItem>
      <AttributeHeading>Data center</AttributeHeading>
      <p data-field="dataCenter">{ticket.dataCenter && ticket.dataCenter.name}</p>
    </AttributeItem>
    <AttributeItem>
      <AttributeHeading>Job code</AttributeHeading>
      <p data-field="jobCode" onClick={openModal} className="has-text-primary is-clickable">
        {ticket.jobCode}
      </p>
    </AttributeItem>
  </AttributesBar>
);

interface TicketDetailProps {
  ticket: TicketResponse;
  note: string;
  comments?: ReviewBriefProperty[] | null;
}

interface ProfileId {
  id: Number;
}

const isOwnerTicket = (profile: ProfileId, createdBy: ProfileId): boolean => {
  if (!profile || !createdBy) return false;
  return profile.id === createdBy.id;
};

const TicketDetail: React.FC<TicketDetailProps & { isReadOnly: boolean }> = (props) => {
  const { ticket, isReadOnly, note, comments } = props;
  const [modalIsOpen, setModalIsOpen] = React.useState<boolean>(false);
  const location = useLocation();
  const { profile } = JSON.parse(localStorage.getItem(settings.localStorageKey) || '{}');

  const openJobCodeModal = (): void => {
    setModalIsOpen(true);
  };

  const onClose = (): void => {
    setModalIsOpen(false);
  };

  return (
    <>
      <JobCodeModal
        modalIsOpen={modalIsOpen}
        onConfirm={onClose}
        onCancel={onClose}
        jobCodeNo={ticket.jobCode}
        modalTitle="Job Code Detail"
        modalCancelText="Close"
      />
      <TicketHeader ticket={ticket} isReadOnly={isReadOnly} />
      <ContentWrapper>
        <p className="has-text-right">
          {!isReadOnly &&
            (ticket.status === 'created' || ticket.status === 'commented' || ticket.status === 'feedback_applied') &&
            isOwnerTicket(profile, ticket.createdBy) && (
              <LinkButton to={`${location.pathname}/edit`} isColor="info" className="is-rounded">
                <Icon className="fas fa-pencil-alt" />
                <span>Edit ticket</span>
              </LinkButton>
            )}
        </p>
        <br />
        <TicketAttributes ticket={ticket} openModal={openJobCodeModal} />
        <LastUpdate model={ticket} />
        <Columns>
          <Column isSize="2/3" className="ticket-items">
            {ticket.noteFromOperator && (
              <Notification isColor="light">
                <p>
                  <strong>Note from operator</strong>
                </p>
                <div>
                  <pre className="comment">{ticket.noteFromOperator}</pre>
                </div>
              </Notification>
            )}
            {note && (
              <Notification style={{ backgroundColor: 'azure' }}>
                <p>
                  <strong>Note from Cloud Admin</strong>
                </p>
                <div>
                  <pre className="comment">{note}</pre>
                </div>
              </Notification>
            )}
            {comments && <CommentBox comments={comments} />}
            {ticket.items.map((item) => (
              <TicketItemDisplay item={item} key={item.id} />
            ))}
          </Column>
          <Column isSize="1/3">
            <TicketTimelineContainer ticket={ticket} />
          </Column>
        </Columns>
      </ContentWrapper>
    </>
  );
};

export default TicketDetail;
export { TicketHeader, TicketAttributes, TicketItemDisplay, TicketItemHeader };
