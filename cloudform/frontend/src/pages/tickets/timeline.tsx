import './timeline.scss';

import { Icon, Tag } from 'bloomer';
import { isNull } from 'lodash';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import approvementsApi, { ApprovementBriefProperty } from '../../api/approvement';
import assignmentApi, { AssignmentResponse } from '../../api/assignment';
import reviewsApi, { ReviewBriefProperty } from '../../api/review';
import { TicketBriefResponse, TicketResponse } from '../../api/ticket';
import {
  DeferRender,
  Timeline,
  TimelineContent,
  TimelineContentHeading,
  TimelineItem,
  TimelineMarker,
} from '../../components';
import { UserTooltip } from '../../components/user-tooltip';
import { displayDateTime } from '../../formatter/date';
import { STATUS_COLOR_MAP, STATUS_TEXT_MAP } from './formatter';

const CreatedStatus: React.FC<{ ticket: TicketResponse | TicketBriefResponse }> = ({ ticket }) => (
  <TimelineItem isColor="is-success">
    <TimelineMarker isIcon={true} isColor="is-success">
      <Icon className="fas fa-file" />
    </TimelineMarker>
    <TimelineContent>
      <TimelineContentHeading>
        <Tag isColor={STATUS_COLOR_MAP['created']}>{STATUS_TEXT_MAP['created']}</Tag>
        {displayDateTime(ticket.createdAt)}
      </TimelineContentHeading>
      <span>
        <UserTooltip user={ticket.createdBy} dataField="createdBy" />
        &nbsp; created the ticket.
      </span>
    </TimelineContent>
  </TimelineItem>
);

const ApproveStatus: React.FC<{ approvements: ApprovementBriefProperty[] }> = ({ approvements }) => {
  return (
    <>
      {approvements.map((approvement) => {
        const icon =
          approvement.isApproved == null ? 'fa-ellipsis-h' : approvement.isApproved ? 'fa-check' : 'fa-times';
        const message =
          approvement.isApproved == null
            ? 'is reviewing the ticket.'
            : approvement.isApproved
            ? 'approved the ticket'
            : `rejected the ticket because ${approvement.reason}`;

        if (!(approvement.ticketStatus === 'rejected' && isNull(approvement.isApproved))) {
          return (
            <TimelineItem key={approvement.id} isColor={approvement.isApproved ? 'is-success' : ''}>
              <TimelineMarker isIcon isColor={approvement.isApproved ? 'is-success' : ''}>
                <Icon className={`fas ${icon}`} />
              </TimelineMarker>
              <TimelineContent>
                {approvement.approvedAt && (
                  <TimelineContentHeading>
                    <Tag isColor={STATUS_COLOR_MAP[approvement.isApproved ? 'approved' : 'rejected']}>
                      {STATUS_TEXT_MAP[approvement.isApproved ? 'approved' : 'rejected']}
                    </Tag>
                    {displayDateTime(approvement.approvedAt)}
                  </TimelineContentHeading>
                )}
                <span>
                  <UserTooltip user={approvement.approver} dataField="approver" />
                  &nbsp;
                  {message}
                </span>
              </TimelineContent>
            </TimelineItem>
          );
        }

        return false;
      })}
    </>
  );
};

const ReviewStatus: React.FC<{ review: ReviewBriefProperty[] | null }> = ({ review }) => {
  const showIcon = (isReject: boolean | undefined, isReviewed: boolean | undefined, note: string | undefined) => {
    if (isReviewed) {
      return 'fa-check';
    } else if (note) {
      return 'fa-comment';
    } else if (isReject) {
      return 'fa-times';
    }
    return 'fa-ellipsis-h';
  };

  const reviewStatus = (
    isReject: boolean | null | undefined,
    isReviewed: boolean | undefined,
    note: string | undefined,
  ) => {
    if (isReviewed) {
      return 'reviewed';
    } else if (note) {
      return 'commented';
    } else if (isReject) {
      return 'rejected';
    }
    return 'assigned';
  };

  return (
    <>
      {review &&
        review.map((res) => {
          return (
            <TimelineItem key={res.id} isColor={res.isReviewed || res.note ? 'is-success' : ''}>
              <TimelineMarker isIcon isColor={res.isReviewed || res.note ? 'is-success' : ''}>
                <Icon className={`fas ${showIcon(res.isReject, res.isReviewed, res.note)}`} />
              </TimelineMarker>
              <TimelineContent>
                {res.reviewer && (
                  <TimelineContentHeading>
                    <Tag isColor={STATUS_COLOR_MAP[reviewStatus(res.isReject, res.isReviewed, res.note)]}>
                      {STATUS_TEXT_MAP[reviewStatus(res.isReject, res.isReviewed, res.note)]}
                    </Tag>
                    {displayDateTime(res.reviewedAt!)}
                  </TimelineContentHeading>
                )}
                <span>
                  {res.reviewer && <UserTooltip user={res.reviewer} dataField="reviewer" />}
                  &nbsp;
                  {res.reviewer
                    ? reviewStatus(res.isReject, res.isReviewed, res.note)
                    : 'Waiting for Reviewer to review'}{' '}
                  the ticket.
                </span>
              </TimelineContent>
            </TimelineItem>
          );
        })}
    </>
  );
};

const ApprovingStatus: React.FC = () => (
  <TimelineItem>
    <TimelineMarker isIcon>
      <Icon className="fas fa-ellipsis-h" />
    </TimelineMarker>
    <TimelineContent>
      <p>Operation team is reviewing your request.</p>
    </TimelineContent>
  </TimelineItem>
);

interface CloseWithoutAssignmentProps {
  ticket: TicketResponse | TicketBriefResponse;
}
const CloseWithoutAssignment: React.FC<CloseWithoutAssignmentProps> = (props) => (
  <TimelineItem>
    <TimelineMarker isIcon>
      <Icon className="fas fa-check" />
    </TimelineMarker>
    <TimelineContent>
      <TimelineContentHeading>
        <Tag isColor={STATUS_COLOR_MAP['completed']}>{STATUS_TEXT_MAP['completed']}</Tag>
        {displayDateTime(props.ticket.updatedAt)}
      </TimelineContentHeading>
      <span>
        Ticket has been closed
        {props.ticket.closedBy ? (
          <>
            &nbsp;by&nbsp;
            <UserTooltip user={props.ticket.closedBy} dataField="assignee" />.
          </>
        ) : (
          <>.</>
        )}
      </span>
    </TimelineContent>
  </TimelineItem>
);

interface AssignedStatusProps {
  assignment: AssignmentResponse | null;
  ticket: TicketResponse | TicketBriefResponse;
}
const AssignedStatus: React.FC<AssignedStatusProps> = ({ assignment, ticket }) => {
  if (assignment == null) return ticket.status === 'completed' ? <CloseWithoutAssignment ticket={ticket} /> : null;
  return (
    <>
      {assignment.activeFlag ? (
        <TimelineItem>
          <TimelineMarker isIcon>
            <Icon className="fas fa-ellipsis-h" />
          </TimelineMarker>
          <TimelineContent>
            <TimelineContentHeading>
              <Tag isColor={STATUS_COLOR_MAP['assigned']}>{STATUS_TEXT_MAP['assigned']}</Tag>
              {assignment.closedAt && displayDateTime(assignment.closedAt)}
            </TimelineContentHeading>
            <span>
              <UserTooltip user={assignment.assignee} dataField="assignee" />
              &nbsp; is working for you.
            </span>
          </TimelineContent>
        </TimelineItem>
      ) : (
        <TimelineItem isColor="is-success">
          <TimelineMarker isIcon isColor="is-success">
            <Icon className="fas fa-check" />
          </TimelineMarker>
          <TimelineContent>
            <TimelineContentHeading>
              <Tag isColor={STATUS_COLOR_MAP['completed']}>{STATUS_TEXT_MAP['completed']}</Tag>
              {displayDateTime(assignment.closedAt)}
            </TimelineContentHeading>
            <span>
              <UserTooltip user={assignment.assignee} dataField="assignee" />
              &nbsp; done your ticket.
            </span>
          </TimelineContent>
        </TimelineItem>
      )}
      <TimelineItem isColor="is-success">
        <TimelineMarker isIcon isColor="is-success">
          <Icon className="fas fa-check" />
        </TimelineMarker>
        <TimelineContent>
          <TimelineContentHeading>
            <Tag isColor={STATUS_COLOR_MAP['dispatched']}>{STATUS_TEXT_MAP['dispatched']}</Tag>
            {displayDateTime(assignment.createdAt)}
          </TimelineContentHeading>
          <span>
            <UserTooltip user={assignment.assigner} dataField="assignee" />
            &nbsp; dispatched the ticket.
          </span>
        </TimelineContent>
      </TimelineItem>
    </>
  );
};

interface TicketTimelineProps {
  ticket: TicketResponse | TicketBriefResponse;
  approvement: Promise<ApprovementBriefProperty[]>;
  assignment: Promise<AssignmentResponse | null>;
  reviewing: Promise<ReviewBriefProperty[] | null>;
}

const TicketTimeline: React.FC<TicketTimelineProps> = (props) => {
  return (
    <Timeline>
      <DeferRender
        promise={props.assignment}
        render={(resp) => <AssignedStatus assignment={resp} ticket={props.ticket} />}
      />
      {props.ticket.status === 'approved' && <ApprovingStatus />}
      {props.ticket.status !== 'created' &&
        props.ticket.status !== 'commented' &&
        props.ticket.status !== 'feedback_applied' && (
          <DeferRender promise={props.approvement} render={(resp) => <ApproveStatus approvements={resp} />} />
        )}
      <DeferRender promise={props.reviewing} render={(resp) => <ReviewStatus review={resp} />} />
      <CreatedStatus ticket={props.ticket} />
    </Timeline>
  );
};

interface TicketTimelineContainerProps {
  ticket: TicketResponse | TicketBriefResponse;
  reviewing?: any;
}

const TicketTimelineContainer: React.FC<TicketTimelineContainerProps> = (props) => {
  const dispatch = useDispatch();
  const ticketId = props.ticket.id;

  const approvementLoader = React.useMemo(async () => {
    return await approvementsApi(dispatch).getByTicket(ticketId);
  }, [dispatch, ticketId]);

  const assignmentLoader = React.useMemo(async () => {
    try {
      return await assignmentApi(dispatch).getByTicket(ticketId);
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      } else {
        throw e;
      }
    }
  }, [dispatch, ticketId]);

  const commentLoader = React.useMemo(async () => {
    try {
      return await reviewsApi(dispatch).getByTicket(ticketId);
    } catch (e) {
      return null;
    }
  }, [dispatch, ticketId]);

  return (
    <TicketTimeline
      ticket={props.ticket}
      approvement={approvementLoader}
      assignment={assignmentLoader}
      reviewing={commentLoader}
    />
  );
};

export default TicketTimelineContainer;
export { TicketTimeline };
