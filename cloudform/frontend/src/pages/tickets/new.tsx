import { Breadcrumb, BreadcrumbItem, Icon } from 'bloomer';
import React from 'react';
import { useDispatch } from 'react-redux';
import { Link, Redirect, useHistory, useLocation } from 'react-router-dom';

import { ApplicationResponse } from '../../api/application';
import dataCenterApi, { DataCentersResponse } from '../../api/data-center';
import resourceApi from '../../api/resource';
import ticketApi, { TicketRequest } from '../../api/ticket';
import { AppHeader, AppSubTitle, AppTitle, ContentWrapper, DeferRender, RoutedSteps } from '../../components';
import { RoutedStepsProps } from '../../components/step';
import { enqueue } from '../../redux/snackbar';
import { initialTicketWithApplication, setDataCenter } from '../../redux/ticket-wizard';
import ApplicationContext from '../applications/context';
import TicketWizardRoutes from './wizard/route';

interface WithApplicationProps {
  application: ApplicationResponse;
}

const Header: React.FC<WithApplicationProps> = ({ application }) => (
  <AppHeader>
    <AppTitle>New Ticket</AppTitle>
    <AppSubTitle>
      <Breadcrumb>
        <ul>
          <BreadcrumbItem>
            <Link to={`/projects/${application.project.id}`} className="has-text-info" data-field="project-name">
              {application.project.name}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link to={`/applications/${application.id}`} className="has-text-info" data-field="application-name">
              {application.name}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link to="#">New Ticket</Link>
          </BreadcrumbItem>
        </ul>
      </Breadcrumb>
    </AppSubTitle>
  </AppHeader>
);

const InitDataCenter: React.FC = () => {
  const search = new URLSearchParams(useLocation().search);
  const searchParam = React.useMemo(() => {
    if (search.get('data-center') && search.get('job-code')) {
      const param = {
        dataCenter: search.get('data-center')!,
        jobCode: search.get('job-code')!,
      };
      return param;
    } else {
      return null;
    }
  }, [search]);

  const dispatch = useDispatch();

  const dataCenterChoices = React.useMemo(() => {
    if (searchParam === null) return Promise.resolve<DataCentersResponse>({ results: [] });
    return dataCenterApi(dispatch).list();
  }, [dispatch, searchParam]);

  return (
    <DeferRender
      promise={dataCenterChoices}
      render={(resp) => {
        if (searchParam == null) return <Redirect to="data-center" />;

        const dc = resp.results.find((dc) => dc.id.toString() === searchParam.dataCenter);
        if (dc) {
          dispatch(setDataCenter(dc, searchParam.jobCode));
          return <Redirect to="resources" />;
        } else {
          return <Redirect to="data-center" />;
        }
      }}
    />
  );
};

const steps: RoutedStepsProps[] = [
  {
    matchRoute: '/applications/:id/new-ticket/data-center',
    title: 'Step 1',
    detail: 'Data center',
  },
  {
    matchRoute: '/applications/:id/new-ticket/resources',
    title: 'Step 2',
    detail: 'Design resources',
  },
  {
    matchRoute: '/applications/:id/new-ticket/approver',
    title: 'Step 3',
    detail: 'Approver',
  },
  {
    matchRoute: '/applications/:id/new-ticket/review',
    title: 'Step 4',
    marker: <Icon className="fa fa-flag" />,
    detail: 'Finish',
  },
];

type NewTicketWizardProps = WithApplicationProps & { onSubmit: (ticket: TicketRequest) => Promise<any> };

const NewTicketWizard: React.FC<NewTicketWizardProps> = (props) => {
  const location = useLocation();
  const doneMatch = location.pathname.endsWith('/done');

  return (
    <>
      <Header application={props.application} />
      <ContentWrapper>
        {doneMatch || <RoutedSteps routes={steps} />}
        {location.pathname.endsWith('/init-dc') ? <InitDataCenter /> : <TicketWizardRoutes onSubmit={props.onSubmit} />}
      </ContentWrapper>
    </>
  );
};

const NewTicketWizardContainer: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  const application = React.useContext(ApplicationContext);
  const initializer = React.useMemo(() => {
    return resourceApi(dispatch)
      .listByApplication(application.id, { limit: 100, offset: 0, status: 'active' })
      .then((resources) => {
        dispatch(initialTicketWithApplication(application, resources.results));
        return true;
      });
  }, [dispatch, application]);

  const onSubmit = React.useCallback(
    (ticket: TicketRequest) => {
      return ticketApi(dispatch)
        .create(ticket)
        .then((resp) => {
          const url = `done?ticket-no=${resp.ticketNo}&ticket-id=${resp.id}`;
          history.replace(url);
          return true;
        })
        .catch((err) => {
          dispatch(enqueue(err.message || 'Error on submitting the ticket. Please try again.', 'danger'));
          throw err;
        });
    },
    [dispatch, history],
  );

  return (
    <DeferRender
      promise={initializer}
      render={() => <NewTicketWizard application={application} onSubmit={onSubmit} />}
    />
  );
};

export default NewTicketWizardContainer;
