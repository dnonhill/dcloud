import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Column,
  Columns,
  Control,
  Field,
  Icon,
  Level,
  LevelItem,
  LevelLeft,
  LevelRight,
  Notification,
  Tag,
} from 'bloomer';
import _ from 'lodash';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import * as Router from 'react-router-dom';
import { Link } from 'react-router-dom';

import assignmentApi, { AssignmentResponse } from '../../api/assignment';
import taskGroupApi, { TaskGroupBriefResponse } from '../../api/task-group';
import { TicketBriefResponse } from '../../api/ticket';
import userApi, { BriefUser, GROUP_CLOUD_ADMIN, GROUP_OPERATOR } from '../../api/user';
import {
  AppHeader,
  AppSubTitle,
  AppTitle,
  AttributeHeading,
  AttributeItem,
  AttributesBar,
  ContentWrapper,
  DeferRender,
  TitleEyebrow,
  useReload,
} from '../../components';
import { UserTooltip } from '../../components/user-tooltip';
import { useUserInGroup, useUserProfile } from '../../redux/auth';
import { enqueue } from '../../redux/snackbar';
import { AssignDialog } from '../assignments/assign-dialog';
import { EstimatedPrice } from '../pricing/pricing';
import JobCodeModal from '../projects/modal';
import { TicketItemHeader } from '../tickets/detail';
import TicketTimelineContainer from '../tickets/timeline';
import TicketNoteDialog from './ticket-note-dialog';

interface WithTicket {
  ticket: TicketBriefResponse;
}

const Header: React.FC<WithTicket> = ({ ticket }) => (
  <AppHeader>
    <TitleEyebrow>Tasks</TitleEyebrow>
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

const TicketAttributes: React.FC<WithTicket & { assignment: AssignmentResponse; openModal?: () => void }> = ({
  ticket,
  assignment,
  openModal,
}) => (
  <AttributesBar>
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
    <AttributeItem>
      <AttributeHeading>Operator</AttributeHeading>
      <UserTooltip user={assignment.assignee} dataField="operator" />
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

interface CloseTicketButtonProps {
  onClose: (note: string | null) => Promise<any>;
  allCompleted?: boolean;
}

const CloseTicketButton: React.FC<CloseTicketButtonProps> = (props) => {
  const [isOpenDialog, setOpenDialog] = React.useState(false);
  const closeDialog = () => setOpenDialog(false);

  const ensureComplete = () => {
    let confirm = true;
    if (!props.allCompleted) {
      confirm = window.confirm('All requests are not completed. Are you sure to close the ticket?');
    }

    if (confirm) {
      setOpenDialog(true);
    }
  };

  const closeTicket = (note: string | null) => {
    props.onClose(note).catch((err) => {
      closeDialog();
    });
  };

  return (
    <>
      <Button
        isColor={props.allCompleted ? 'info' : 'grey'}
        isSize="small"
        onClick={ensureComplete}
        data-action="close-ticket"
      >
        <Icon className="far fa-check-circle" />
        <span>Close ticket</span>
      </Button>
      <TicketNoteDialog isActive={isOpenDialog} onClose={closeDialog} onSave={closeTicket} />
    </>
  );
};

interface ReAssigmentButtonProps {
  onAssigneeSelected: (assigneeId: number, note: string) => void;
  assigneeId: number;
  note: string;
}

const ReAssignmentButton: React.FC<ReAssigmentButtonProps> = (props) => {
  const [isOpenDialog, setOpenDialog] = React.useState(false);
  const closeDialog = () => setOpenDialog(false);

  const [allOperators, setAllOperators] = React.useState<BriefUser[]>([]);
  const dispatch = useDispatch();
  const { assigneeId, note } = props;
  React.useEffect(() => {
    let didCancel = false;
    userApi(dispatch)
      .listOperators()
      .then((resp) => {
        if (!didCancel) {
          setAllOperators(resp.results.filter((operator) => operator.id !== assigneeId));
        }
      });

    return () => {
      didCancel = true;
    };
  }, [dispatch, assigneeId]);

  return (
    <>
      <Button onClick={() => setOpenDialog(true)} isSize="small">
        <Icon className="fas fa-users-cog" />
        <span>Reassign</span>
      </Button>

      <AssignDialog
        note={note}
        allOperators={allOperators}
        onAssigneeSelected={props.onAssigneeSelected}
        isActive={isOpenDialog}
        onClose={closeDialog}
      />
    </>
  );
};

type AssignmentDetailProps = {
  assignment: AssignmentResponse;
  taskGroups: TaskGroupBriefResponse[];
  onAssigneeSelected: (assigneeId: number, note: string) => void;
  canCloseTicket?: boolean;
  noteAssignment: AssignmentResponse;
} & CloseTicketButtonProps;

const AssignmentDetail: React.FC<AssignmentDetailProps> = (props) => {
  const { assignment, taskGroups, noteAssignment } = props;
  const { ticket } = assignment;
  const { note } = noteAssignment;
  const [modalIsOpen, setModalIsOpen] = React.useState<boolean>(false);

  const openJobCodeModal = (): void => {
    setModalIsOpen(true);
  };

  const onClose = (): void => {
    setModalIsOpen(false);
  };

  const canReAssign = useUserInGroup(GROUP_CLOUD_ADMIN);
  const canSeeResourceValue = useUserInGroup(GROUP_OPERATOR);
  const user = useUserProfile();
  const canCloseTicket = user && user.id === assignment.assignee.id;

  const location = Router.useLocation();
  const allCompleted = taskGroups.every((task) => task.complete);

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
        <TicketAttributes ticket={ticket} assignment={assignment} openModal={openJobCodeModal} />
        <Columns>
          <Column isSize="2/3">
            {ticket.status === 'assigned' && (
              <Field isGrouped="right">
                {canReAssign && (
                  <Control>
                    <ReAssignmentButton
                      assigneeId={assignment.assignee.id || 0}
                      onAssigneeSelected={props.onAssigneeSelected}
                      note={note}
                    />
                  </Control>
                )}
                {canCloseTicket && (
                  <Control>
                    <CloseTicketButton onClose={props.onClose} allCompleted={allCompleted} />
                  </Control>
                )}
              </Field>
            )}
            {ticket.noteFromOperator && (
              <Notification isColor="light">
                <p>
                  <strong>Note to requestor</strong>
                </p>
                <div>
                  <pre className="comment">{ticket.noteFromOperator}</pre>
                </div>
              </Notification>
            )}
            {noteAssignment && noteAssignment.note && (
              <Notification style={{ backgroundColor: 'azure' }}>
                <p className="has-text-primary">
                  <strong>Note to operator</strong>
                </p>
                <div>
                  <pre className="comment">{noteAssignment.note}</pre>
                </div>
              </Notification>
            )}
            {_.sortBy(taskGroups, ['id']).map((taskGroup) => (
              <Box className="task-group" data-id={taskGroup.id} key={taskGroup.id}>
                <Level>
                  <LevelLeft>
                    <LevelItem>
                      <Router.Link to={`${location.pathname}/task-groups/${taskGroup.id}`}>
                        <TicketItemHeader ticketItem={taskGroup.ticketItem} />
                        <br />
                        <EstimatedPrice item={taskGroup.ticketItem} />
                      </Router.Link>
                    </LevelItem>
                  </LevelLeft>
                  <LevelRight>
                    <LevelItem>
                      {taskGroup.complete && (
                        <Tag isColor="success" className="completed">
                          COMPLETED
                        </Tag>
                      )}
                    </LevelItem>
                    {canSeeResourceValue && 
                    // If specification.message is exists, <RsourceValue> will not display
                    // specification.message represent the request is special request 
                    !taskGroup.ticketItem.specification?.message && 
                    <ResourceValue specification={taskGroup.ticketItem.specification} />}
                  </LevelRight>
                </Level>
              </Box>
            ))}
          </Column>
          <Column isSize="1/3">
            <TicketTimelineContainer ticket={assignment.ticket} />
          </Column>
        </Columns>
      </ContentWrapper>
    </>
  );
};

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

const AssignmentDetailPage = () => {
  const dispatch = useDispatch();
  const { id } = Router.useParams();
  const history = Router.useHistory();
  const { reloadFlag, reload } = useReload();

  const assignmentLoader = React.useMemo(async () => {
    if (!id) throw new Error('No assignment ID given.');

    const assignmentPromise = assignmentApi(dispatch).get(id);
    const taskGroupsPromise = taskGroupApi(dispatch).listByAssignment(id);
    const notePromise = assignmentApi(dispatch).getNote(id);

    return {
      assignment: await assignmentPromise,
      taskGroups: await taskGroupsPromise,
      noteAssignment: await notePromise,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, id, reloadFlag]);

  const onClose = async (note: string | null) => {
    try {
      if (id) {
        await assignmentApi(dispatch).close(id, note);
        dispatch(enqueue('Ticket has been closed.', 'success'));
        history.push('/my-assignments');
      }
    } catch (err) {
      dispatch(enqueue('Error while closing the ticket.', 'error'));
      throw err;
    }
  };

  const onReassign = (assigneeId: number, note?: string) => {
    if (!id) return;

    assignmentApi(dispatch)
      .reassign(parseInt(id), assigneeId, note)
      .then(() => {
        reload();
        dispatch(enqueue('Ticket has been reassign.', 'success'));
      })
      .catch((err) => {
        dispatch(enqueue('Error while closing the ticket.', 'error'));
        console.error(err);
      });
  };

  return (
    <DeferRender
      promise={assignmentLoader}
      render={(assignments) => <AssignmentDetail {...assignments} onClose={onClose} onAssigneeSelected={onReassign} />}
    />
  );
};

export default AssignmentDetailPage;
