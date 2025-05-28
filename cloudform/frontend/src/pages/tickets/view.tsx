import * as React from 'react';
import * as Redux from 'react-redux';
import * as Router from 'react-router-dom';
import { useLocation } from 'react-router-dom';

import assignmentApi from '../../api/assignment';
import reviewsApi from '../../api/review';
import ticketApi from '../../api/ticket';
import { DeferRender } from '../../components';
import TicketDetail from './detail';

const TicketViewPage: React.FC = () => {
  const dispatch = Redux.useDispatch();
  const { id } = Router.useParams();
  const { search } = useLocation();
  const isReadOnly = new URLSearchParams(search).get('isReadOnly') === 'true';

  const ticketLoader = React.useMemo(async () => {
    if (id == null) throw Error('Ticket ID is not given.');

    return await ticketApi(dispatch).get(id);
  }, [dispatch, id]);

  const assignmentLoader = React.useMemo(async () => {
    try {
      if (id !== undefined) {
        return await assignmentApi(dispatch).getNoteByTicket(id);
      }
    } catch (e) {
      return null;
    }
  }, [dispatch, id]);

  const commentLoader = React.useMemo(async () => {
    try {
      if (id !== undefined) {
        return await reviewsApi(dispatch).getByTicket(id);
      }
    } catch (e) {
      return null;
    }
  }, [dispatch, id]);

  const loaders = Promise.all([ticketLoader, assignmentLoader, commentLoader]);

  return (
    <DeferRender
      promise={loaders}
      render={([ticket, assignment, comments]) => {
        return (
          <TicketDetail
            ticket={ticket}
            isReadOnly={isReadOnly}
            note={assignment ? assignment.note : ''}
            comments={comments}
          />
        );
      }}
    />
  );
};

export default TicketViewPage;
