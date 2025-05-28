import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardHeaderIcon,
  CardHeaderTitle,
  Control,
  Field,
  Icon,
  LevelItem,
  Subtitle,
  Title,
} from 'bloomer';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { Link, useHistory, useParams } from 'react-router-dom';

import assignmentApi from '../../api/assignment';
import ticketApi, { TicketResponse } from '../../api/ticket';
import userApi, { BriefUser } from '../../api/user';
import { ReactComponent as Done } from '../../asset/done.svg';
import {
  AppHeader,
  AppSubTitle,
  AppTitle,
  AttributeHeading,
  AttributeItem,
  AttributesBar,
  CollapsibleBox,
  CollapsibleIcon,
  ContentWrapper,
  DeferRender,
  IllustratedMessage,
  IllustratedMessageContent,
  IllustratedMessageIllustration,
  TitleEyebrow,
} from '../../components';
import { UserTooltip } from '../../components/user-tooltip';
import { displayRelativeDate } from '../../formatter/date';
import { enqueue } from '../../redux/snackbar';
import TicketNoteDialog from '../my-assignments/ticket-note-dialog';
import { EstimatedPrice } from '../pricing/pricing';
import JobCodeModal from '../projects/modal';
import { TicketItemHeader } from '../tickets/detail';
import { SpecificationContent } from '../tickets/resource-spec';
import { AssignDialog } from './assign-dialog';

interface WithTicket {
  ticket: TicketResponse;
}

const Header: React.FC<WithTicket> = ({ ticket }) => (
  <AppHeader>
    <TitleEyebrow>Dispatch Ticket</TitleEyebrow>
    <AppTitle data-field="ticket-no">{ticket.ticketNo}</AppTitle>
    <AppSubTitle>
      <Breadcrumb>
        <ul>
          <BreadcrumbItem>
            <Link
              to={`/projects/${ticket.project.id}?isReadOnly=true`}
              className="has-text-info"
              data-field="project-name"
            >
              {ticket.project.name}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link
              to={`/applications/${ticket.application.id}?isReadOnly=true`}
              className="has-text-info"
              data-field="application-name"
            >
              {ticket.application.name}
            </Link>
          </BreadcrumbItem>
        </ul>
      </Breadcrumb>
    </AppSubTitle>
  </AppHeader>
);

const TicketAttributes: React.FC<WithTicket & { openModal?: () => void }> = ({ ticket, openModal }) => (
  <AttributesBar>
    <AttributeItem>
      <AttributeHeading>Request at</AttributeHeading>
      <p>{displayRelativeDate(ticket.createdAt)}</p>
    </AttributeItem>
    <AttributeItem>
      <AttributeHeading>Requestor</AttributeHeading>
      <UserTooltip user={ticket.createdBy} dataField="requestor" />
    </AttributeItem>
    <AttributeItem>
      <AttributeHeading>Data center</AttributeHeading>
      <p>{ticket.dataCenter && ticket.dataCenter.name}</p>
    </AttributeItem>
    <AttributeItem>
      <AttributeHeading>Job code</AttributeHeading>
      <p data-field="jobCode" onClick={openModal} className="has-text-primary is-clickable">
        {ticket.jobCode}
      </p>
    </AttributeItem>
    {ticket.application.systemDiagram && (
      <AttributeItem>
        <AttributeHeading>System diagram</AttributeHeading>
        <a href={ticket.application.systemDiagram} target="_blank" rel="noopener noreferrer">
          <Icon className="fas fa-download" />
          <span>Download</span>
        </a>
      </AttributeItem>
    )}
  </AttributesBar>
);

const DispatchedMessage: React.FC = () => (
  <IllustratedMessage>
    <IllustratedMessageIllustration>
      <Done />
    </IllustratedMessageIllustration>
    <IllustratedMessageContent>
      <Title className="has-text-success">This ticket has been dispatched.</Title>
      <Subtitle className="has-text-success">Thank you for your cooperation.</Subtitle>
    </IllustratedMessageContent>
  </IllustratedMessage>
);

const TicketItems: React.FC<WithTicket> = ({ ticket }) => (
  <>
    <Title isSize={5}>Resources</Title>
    {ticket.items.map((item) => (
      <Card key={item.id}>
        <CollapsibleBox
          headerType={({ isOpen }) => (
            <CardHeader>
              <CardHeaderTitle className="has-text-primary" style={{ flexWrap: 'wrap' }}>
                <TicketItemHeader ticketItem={item} />
                <EstimatedPrice item={item} />
              </CardHeaderTitle>
              
              {
                // If specification.message is exists, <RsourceValue> will not display
                // specification.message represent the request is special request 
                !item.specification?.message &&
                <ResourceValue specification={item.specification} />
              }
              <CardHeaderIcon>
                <CollapsibleIcon isOpen={isOpen} />
              </CardHeaderIcon>
            </CardHeader>
          )}
        >
          <CardContent>
            <SpecificationContent ticketItem={item} />
          </CardContent>
        </CollapsibleBox>
      </Card>
    ))}
  </>
);

interface ResourceValueProps {
  specification?: any;
}

const ResourceValue: React.FC<ResourceValueProps> = (props) => {
  const { specification } = props;
  const sumDiskSize =
    (specification.mainStorage || 0) +
    (specification.osDisk || 0) +
    (specification.additionalOsDisk || 0) +
    (specification.dataDisk1Size || 0) +
    (specification.dataDisk2Size || 0);
  return (
    <LevelItem>
      <div style={{ marginLeft: '16px;' }}>
        <span>
          <Icon isAlign="left" className="fas fa-microchip" />
          <span className="is-fullflex is-size-7 has-text-grey has-text-weight-normal" style={{ marginLeft: '8px' }}>
            {`${specification.cpu}`}
          </span>
          <span className="is-fullflex is-size-7 has-text-grey has-text-weight-normal" style={{ marginLeft: '4px' }}>
            Cores
          </span>
        </span>
        <span style={{ marginLeft: '8px' }}>
          <Icon isAlign="left" className="fas fa-memory" />
          <span className="is-fullflex is-size-7 has-text-grey has-text-weight-normal" style={{ marginLeft: '8px' }}>
            {`${specification.memory}`}
          </span>
          <span className="is-fullflex is-size-7 has-text-grey has-text-weight-normal" style={{ marginLeft: '4px' }}>
            GB
          </span>
        </span>
        <span style={{ marginLeft: '8px' }}>
          <Icon isAlign="left" className="fas fa-hdd" />
          <span className="is-fullflex is-size-7 has-text-grey has-text-weight-normal" style={{ marginLeft: '8px' }}>
            {`${sumDiskSize}`}
          </span>
          <span className="is-fullflex is-size-7 has-text-grey has-text-weight-normal" style={{ marginLeft: '4px' }}>
            GB
          </span>
        </span>
      </div>
    </LevelItem>
  );
};


interface AssignmentBarProps {
  allOperators: BriefUser[];
  onAssigneeSelected: (assigneeId: number, note: string) => void;
  onCloseTicket: (note: string) => void;
  note?: string;
}

const AssignmentBar: React.FC<AssignmentBarProps> = (props) => {
  const styles: React.CSSProperties = {
    position: 'fixed',
    width: '100%',
    height: '10vh',
    bottom: 0,
    left: 0,
    background: '#FFF',
  };

  const [isOpenAssignDialog, setOpenAssignDialog] = React.useState(false);
  const closeAssignDialog = () => setOpenAssignDialog(false);

  const [isOpenCloseDialog, setOpenCloseDialog] = React.useState(false);
  const closeCloseDialog = () => setOpenCloseDialog(false);

  return (
    <>
      <div id="approvement-panel" style={styles}>
        <Field isGrouped="centered">
          <Control>
            <Button isColor="primary" onClick={() => setOpenAssignDialog(true)} data-action="assign">
              <Icon className="fas fa-users-cog" />
              <span>Assign</span>
            </Button>
          </Control>
          <Control>
            <Button onClick={() => setOpenCloseDialog(true)} data-action="close">
              <Icon className="far fa-times-circle" />
              <span>Close ticket</span>
            </Button>
          </Control>
        </Field>
      </div>
      <AssignDialog
        allOperators={props.allOperators}
        onAssigneeSelected={props.onAssigneeSelected}
        isActive={isOpenAssignDialog}
        onClose={closeAssignDialog}
        note={props.note}
      />
      <TicketNoteDialog isActive={isOpenCloseDialog} onClose={closeCloseDialog} onSave={props.onCloseTicket} />
    </>
  );
};

type TicketAssignmentProps = WithTicket & AssignmentBarProps;

const TicketAssignment: React.FC<TicketAssignmentProps> = (props) => {
  const { ticket } = props;
  const [modalIsOpen, setModalIsOpen] = React.useState<boolean>(false);

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
      <Header ticket={ticket} />
      <ContentWrapper>
        <TicketAttributes ticket={ticket} openModal={openJobCodeModal} />
        {ticket.status !== 'approved' && <DispatchedMessage />}
        <TicketItems ticket={ticket} />
        <div style={{ paddingBottom: '3em' }} />
      </ContentWrapper>
      {ticket.status === 'approved' && (
        <AssignmentBar
          allOperators={props.allOperators}
          onAssigneeSelected={props.onAssigneeSelected}
          onCloseTicket={props.onCloseTicket}
          note={props.note}
        />
      )}
    </>
  );
};

const TicketAssignmentPage: React.FC = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const history = useHistory();

  const ticketLoader = React.useMemo(async () => {
    if (!id) throw new Error('No ticket id is given.');

    const ticket = await ticketApi(dispatch).get(id);
    const { results } = await userApi(dispatch).listOperators();

    return {
      ticket,
      allOperators: results,
    };
  }, [dispatch, id]);

  const onAssigneeSelected = (assignee: number, note?: string) => {
    if (id !== undefined) {
      assignmentApi(dispatch)
        .assign(parseInt(id), assignee, note)
        .then(() => {
          history.push('/assignments');
          dispatch(enqueue('Ticket has been assigned.', 'success'));
        })
        .catch(() => {
          dispatch(enqueue('Error while assign the ticket.', 'danger'));
        });
    }
  };

  const onCloseTicket = async (note: string) => {
    if (id === undefined) return;
    try {
      await ticketApi(dispatch).close(id, note);
      history.push('/assignments');
      dispatch(enqueue('Ticket has been closed.', 'success'));
    } catch (error) {
      console.error('Error during close ticket', error);
      const message = error.detail || 'Error during close the ticket.';
      dispatch(enqueue(message, 'danger'));
    }
  };

  return (
    <DeferRender
      promise={ticketLoader}
      render={(response) => (
        <TicketAssignment
          ticket={response.ticket}
          allOperators={response.allOperators}
          onAssigneeSelected={onAssigneeSelected}
          onCloseTicket={onCloseTicket}
        />
      )}
    />
  );
};

export default TicketAssignmentPage;
