import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardHeaderIcon,
  CardHeaderTitle,
  Control,
  Field,
  Subtitle,
  Title,
} from 'bloomer';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ResourceProperty } from '../../../api/resource';
import { TicketItemProperty, TicketRequest } from '../../../api/ticket';
import { AttributeHeading, AttributeItem, AttributesBar, CollapsibleBox, CollapsibleIcon } from '../../../components';
import { enqueue } from '../../../redux/snackbar';
import { ApplicationState } from '../../../redux/state';
import { TicketWizardProperty, TicketWizardState } from '../../../redux/ticket-wizard';
import { EstimatedPrice, TotalPricePanel } from '../../pricing/pricing';
import { TicketItemHeader } from '../detail';
import { SpecificationContent } from '../resource-spec';
import { convertStateToRequest } from './state-to-service';

interface WithTicketProps {
  ticket: TicketWizardProperty;
}

const TicketAttributes: React.FC<WithTicketProps> = ({ ticket }) => (
  <AttributesBar>
    <AttributeItem>
      <AttributeHeading>DATA CENTER</AttributeHeading>
      <p data-field="dataCenter" data-value={ticket.dataCenter ? ticket.dataCenter.id.toString() : ''}>
        {ticket.dataCenter && ticket.dataCenter.name}
      </p>
    </AttributeItem>
    <AttributeItem>
      <AttributeHeading>JOB CODE</AttributeHeading>
      <p data-field="jobCode">{ticket.jobCode}</p>
    </AttributeItem>
    <AttributeItem>
      <AttributeHeading>APPROVER</AttributeHeading>
      {ticket.approvers &&
        ticket.approvers.map((approver) => {
          return (
            <p data-field="approver" data-value={approver.id} key={approver.id}>
              {approver.user.fullname || approver.user.username}
            </p>
          );
        })}
    </AttributeItem>
  </AttributesBar>
);

const TicketItem: React.FC<{ ticketItem: TicketItemProperty; resource?: ResourceProperty }> = (props) => {
  const { ticketItem, resource } = props;
  return (
    <Card>
      <CollapsibleBox
        headerType={({ isOpen }) => (
          <CardHeader>
            <CardHeaderTitle style={{ flexWrap: 'wrap' }}>
              <TicketItemHeader ticketItem={ticketItem} resource={resource} />
              <br />
              <EstimatedPrice item={ticketItem} />
            </CardHeaderTitle>
            <CardHeaderIcon>
              <CollapsibleIcon isOpen={isOpen} />
            </CardHeaderIcon>
          </CardHeader>
        )}
      >
        <CardContent>
          <SpecificationContent ticketItem={ticketItem} resource={resource} />
        </CardContent>
      </CollapsibleBox>
    </Card>
  );
};

interface ReviewStepProps {
  ticket: TicketWizardProperty;
  resources: ResourceProperty[];
  isSubmitting: boolean;
  onSubmit: () => void;
}

const ReviewStep: React.FC<ReviewStepProps> = (props) => {
  const { ticket, resources, isSubmitting, onSubmit } = props;
  return (
    <>
      <Title isSize={4}>Your ticket is almost done.</Title>
      <Subtitle isSize={6}>Please review and submit your request.</Subtitle>
      <TicketAttributes ticket={ticket} />

      <div className="divider" data-content="Resources" />
      {ticket.items.map((item, i) => (
        <TicketItem
          ticketItem={item}
          key={i}
          resource={
            item.resource === undefined ? undefined : resources.find((resource) => resource.id === item.resource)
          }
        />
      ))}
      <br />
      <TotalPricePanel items={ticket.items} />
      <br />
      <Field>
        <Control>
          <Button isColor="primary" data-action="submit-request" onClick={() => onSubmit()} isLoading={isSubmitting}>
            Submit the request
          </Button>
        </Control>
      </Field>
    </>
  );
};

interface ReviewStepPageProps {
  onSubmit: (ticket: TicketRequest) => Promise<any>;
}

const ReviewStepPage: React.FC<ReviewStepPageProps> = (props) => {
  const { ticket, resources } = useSelector<ApplicationState, TicketWizardState>((state) => state.ticketWizard!);

  const dispatch = useDispatch();
  const [isSubmitting, setSubmitting] = React.useState(false);
  const { onSubmit } = props;

  const handleSubmit = React.useCallback(() => {
    setSubmitting(true);
    if (!ticket) return;

    const request = convertStateToRequest(ticket);
    if (request == null) {
      dispatch(enqueue('The ticket is incomplete.', 'danger'));
      setSubmitting(false);
      return;
    }

    onSubmit(request).catch(() => setSubmitting(false));
  }, [dispatch, ticket, onSubmit]);

  if (!ticket) return null;

  return <ReviewStep ticket={ticket} resources={resources} isSubmitting={isSubmitting} onSubmit={handleSubmit} />;
};

export default ReviewStepPage;
export { ReviewStep };
