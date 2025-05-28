import { Breadcrumb, BreadcrumbItem, Icon } from 'bloomer';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

import approvementsApi from '../../api/approvement';
import resourceApi from '../../api/resource';
import ticketApi, { TicketRequest, TicketResponse } from '../../api/ticket';
import { AppHeader, AppSubTitle, AppTitle, ContentWrapper, DeferRender, RoutedSteps } from '../../components';
import { RoutedStepsProps } from '../../components/step';
import { enqueue } from '../../redux/snackbar';
import { initialTicketWithExisting } from '../../redux/ticket-wizard';
import TicketWizardRoutes from './wizard/route';

interface WithTicketProps {
  ticket: TicketResponse;
}

const Header: React.FC<WithTicketProps> = ({ ticket }) => (
  <AppHeader>
    <AppTitle>Edit Ticket {ticket.ticketNo}</AppTitle>
    <AppSubTitle>
      <Breadcrumb>
        <ul>
          <BreadcrumbItem>
            <Link to={`/projects/${ticket.project.id}`} className="has-text-info" data-field="project-name">
              {ticket.project.name}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link to={`/applications/${ticket.application.id}`} className="has-text-info" data-field="application-name">
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

const steps: RoutedStepsProps[] = [
  {
    matchRoute: '/tickets/:id/edit/data-center',
    title: 'Step 1',
    detail: 'Data center',
  },
  {
    matchRoute: '/tickets/:id/edit/resources',
    title: 'Step 2',
    detail: 'Design resources',
  },
  {
    matchRoute: '/tickets/:id/edit/approver',
    title: 'Step 3',
    detail: 'Approver',
  },
  {
    matchRoute: '/tickets/:id/edit/review',
    title: 'Step 4',
    marker: <Icon className="fa fa-flag" />,
    detail: 'Finish',
  },
];

type EditTicketWizardProps = WithTicketProps & {
  onSubmit: (ticket: TicketRequest) => Promise<any>;
};

const EditTicketWizard: React.FC<EditTicketWizardProps> = (props) => {
  return (
    <>
      <Header ticket={props.ticket} />
      <ContentWrapper>
        <RoutedSteps routes={steps} />
        <TicketWizardRoutes onSubmit={props.onSubmit} />
      </ContentWrapper>
    </>
  );
};

const EditTicketWizardContainer: React.FC = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const history = useHistory();

  const initializer = React.useMemo(async () => {
    if (!id) throw Error('No ticket id provided');

    const ticket = await ticketApi(dispatch).get(id);
    const approvement = approvementsApi(dispatch).getByTicket(id);
    const resources = resourceApi(dispatch).listByApplication(ticket.application.id, {
      limit: 100,
      offset: 0,
      status: 'active',
    });

    dispatch(initialTicketWithExisting(ticket, await approvement, (await resources).results));

    return ticket;
  }, [dispatch, id]);

  const onSubmit = React.useCallback(
    (ticket: TicketRequest) => {
      if (!id) return Promise.reject('No ticket id provided');

      return ticketApi(dispatch)
        .update(id, ticket)
        .then((resp) => {
          history.push(`/tickets/${id}`);
          dispatch(enqueue('Ticket was updated.', 'success'));
          return true;
        })
        .catch((err) => {
          let message: string | JSX.Element = err.message || 'Error on submitting the ticket. Please try again.';
          if (err.code && err.code === 405) {
            message = (
              <>
                <span>{err.message}</span>&nbsp;
                <Link to={`/tickets/${id}`} className="has-text-link">
                  View ticket
                </Link>
              </>
            );
          }
          dispatch(enqueue(message, 'danger'));
          throw err;
        });
    },
    [dispatch, history, id],
  );

  return (
    <DeferRender promise={initializer} render={(ticket) => <EditTicketWizard ticket={ticket} onSubmit={onSubmit} />} />
  );
};

export default EditTicketWizardContainer;
