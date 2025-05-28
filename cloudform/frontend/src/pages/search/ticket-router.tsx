import * as React from 'react';
import { useDispatch } from 'react-redux';
import { Redirect, useParams } from 'react-router';

import assignmentApi, { AssignmentResponse } from '../../api/assignment';
import { DeferRender } from '../../components';
import { useUserInGroup, useUserProfile } from '../../redux/auth';

function ticketMappingPath(ticketId: string, assignment: AssignmentResponse | null) {
  if (assignment) {
    return `/my-assignments/${assignment.id}`;
  } else {
    return `/tickets/${ticketId}?isReadOnly=true`;
  }
}

const TicketRouter: React.FC = () => {
  const { ticketId } = useParams();
  const dispatch = useDispatch();

  const isCloudAdmin = useUserInGroup('cloudadmin');
  const user = useUserProfile();

  const assignmentLoader = React.useMemo(async () => {
    if (!ticketId) throw new Error('No ticketId');
    try {
      const resp = await assignmentApi(dispatch).getByTicket(ticketId);
      return isCloudAdmin || resp.assignee.id === user!.id ? resp : null;
    } catch (err) {
      if (err.statusCode && err.statusCode === 404) {
        return null;
      } else {
        throw err;
      }
    }
  }, [dispatch, isCloudAdmin, ticketId, user]);

  if (!ticketId) return null;
  return (
    <DeferRender
      promise={assignmentLoader}
      render={(assignment) => <Redirect to={ticketMappingPath(ticketId, assignment)} />}
    />
  );
};

export default TicketRouter;
