import { Box, Field, Level, LevelItem, LevelLeft, LevelRight, Select, Tag, Title } from 'bloomer';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import {
  DEFAULT_PAGINATION,
  OrderDirection,
  QueryOptions,
  setQueryOrdering,
  setQueryPagination,
  updateQueryFilter,
  useQueryOptions,
} from '../../api/list-options';
import ticketApi, { TicketBriefResponse } from '../../api/ticket';
import { ReactComponent as EmptyCart } from '../../asset/empty_cart.svg';
import {
  ContentWrapper,
  DeferRender,
  IllustratedPage,
  LinkButton,
  SearchPane,
  SortPane,
  useDebounce,
} from '../../components';
import { ItemsNotFound } from '../../components/illustration';
import PaginationContainer from '../../components/pagination';
import { displayRelativeDate } from '../../formatter/date';
import ApplicationContext from '../applications/context';
import ApplicationHeader from '../applications/header';
import { STATUS_COLOR_MAP, STATUS_TEXT_MAP } from './formatter';

const TicketRow: React.FC<{ ticket: TicketBriefResponse; isReadOnly: boolean }> = ({ ticket, isReadOnly }) => (
  <Box data-id={ticket.id} className="ticket">
    <Level>
      <LevelLeft>
        <LevelItem>
          <div>
            <small className="is-family-secondary">TICKET NO</small>&nbsp;
            <Link to={`/tickets/${ticket.id}` + (isReadOnly ? '?isReadOnly=true' : '')}>
              <strong data-field="ticket-no">{ticket.ticketNo}</strong>
            </Link>
            &nbsp;
            <Tag isColor={STATUS_COLOR_MAP[ticket.status] || 'info'} data-field="status">
              {STATUS_TEXT_MAP[ticket.status]}
            </Tag>
            <br />
            <small className="has-text-grey is-family-secondary">
              {ticket.dataCenter && ticket.dataCenter.name} &nbsp;/&nbsp; JOB CODE: {ticket.jobCode}
            </small>
          </div>
        </LevelItem>
        <LevelItem></LevelItem>
      </LevelLeft>
      <LevelRight className="has-text-grey">
        <LevelItem>
          <small className="is-family-secondary">
            Requested&nbsp;
            <span>{displayRelativeDate(ticket.createdAt)}</span>
          </small>
        </LevelItem>
      </LevelRight>
    </Level>
  </Box>
);

const NewTicketButton: React.FC<{ applicationId: string | number }> = (props) => (
  <LinkButton
    to={`/applications/${props.applicationId}/new-ticket`}
    icon="fa fa-plus"
    isColor="info"
    data-action="new-ticket"
    className="is-rounded"
  >
    <span>New Ticket</span>
  </LinkButton>
);

interface StatusFilterProps {
  onFilterChange: (value: string) => void;
  initialValue?: string;
}

const StatusFilter: React.FC<StatusFilterProps> = (props) => {
  const [value, setValue] = React.useState(props.initialValue || 'active');
  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.currentTarget.value;
    if (value !== newValue) {
      setValue(newValue);
      props.onFilterChange(newValue);
    }
  };

  return (
    <Select value={value} onChange={onChange}>
      <option value="all">All status</option>
      <option value="active">Active</option>
      <option value="rejected">Rejected</option>
      <option value="completed">Completed</option>
    </Select>
  );
};

interface CreateFirstTicketProps {
  applicationId: string | number;
  isReadOnly: boolean;
}

const CreateFirstTicket: React.FC<CreateFirstTicketProps> = (props) => (
  <IllustratedPage>
    <EmptyCart />
    <Title>We don't have any ticket in this type.</Title>
    {!props.isReadOnly && (
      <Field isGrouped="centered">
        <NewTicketButton applicationId={props.applicationId} />
      </Field>
    )}
  </IllustratedPage>
);

interface TicketListProps {
  applicationId: string | number;
  items: TicketBriefResponse[];
  isReadOnly?: boolean;
  isSearch?: boolean;
}

const TicketList: React.FC<TicketListProps> = ({ applicationId, items, isReadOnly = false, isSearch = false }) => {
  if (items.length <= 0) {
    if (isSearch) {
      return <ItemsNotFound title="Cannot find matched tickets." />;
    } else {
      return <CreateFirstTicket applicationId={applicationId} isReadOnly={isReadOnly} />;
    }
  } else {
    return (
      <div className="tickets-container">
        {items.map((ticket) => (
          <TicketRow ticket={ticket} key={ticket.id} isReadOnly={isReadOnly} />
        ))}
      </div>
    );
  }
};

const TicketsByApplication: React.FC<{ isReadOnly: boolean }> = ({ isReadOnly }) => {
  const dispatch = useDispatch();
  const application = React.useContext(ApplicationContext);
  const applicationId = application.id;

  const defaultQueryOptions: QueryOptions = {
    paginate: DEFAULT_PAGINATION,
    order: {
      field: 'created_at',
      direction: 'DSC',
    },
    filter: {
      status: 'active',
    },
  };

  if (isReadOnly) (defaultQueryOptions.filter as any).all = 'true';

  const { queryOptions, dispatchQuery, queryParams } = useQueryOptions(defaultQueryOptions);
  const debouncedParams = useDebounce(queryParams);

  const onDirectionChange = (direction: OrderDirection) =>
    dispatchQuery(
      setQueryOrdering({
        field: 'created_at',
        direction,
      }),
    );

  const setTicketKeyword = (keyword: string) => dispatchQuery(updateQueryFilter({ ticket_no__startswith: keyword }));
  const setStatus = (status: string) => dispatchQuery(updateQueryFilter({ status }));

  const loader = React.useMemo(() => ticketApi(dispatch).listByApplication(applicationId, debouncedParams), [
    dispatch,
    applicationId,
    debouncedParams,
  ]);

  return (
    <>
      <ApplicationHeader application={application} isReadOnly={isReadOnly} />
      <ContentWrapper>
        <Level>
          <LevelLeft>
            <LevelItem>
              <StatusFilter onFilterChange={setStatus} initialValue="active" />
            </LevelItem>
            <LevelItem>
              <SearchPane displayName="Ticket no" onSearch={setTicketKeyword} />
            </LevelItem>
          </LevelLeft>
          <LevelRight>
            <LevelItem>
              <SortPane
                onDirectionChange={onDirectionChange}
                initial="DSC"
                descendingLabel="Newest first"
                ascendingLabel="Oldest first"
              />
            </LevelItem>
            {!isReadOnly && (
              <LevelItem>
                <NewTicketButton applicationId={applicationId} />
              </LevelItem>
            )}
          </LevelRight>
        </Level>
        <DeferRender
          promise={loader}
          render={(response) => (
            <>
              <TicketList items={response.results} applicationId={applicationId} isReadOnly={isReadOnly} />
              <PaginationContainer
                response={response}
                currentPage={queryOptions.paginate.currentPage}
                itemPerPage={queryOptions.paginate.itemPerPage}
                onPageChange={(paginate) => dispatchQuery(setQueryPagination(paginate))}
              />
            </>
          )}
        />
      </ContentWrapper>
    </>
  );
};

export default TicketsByApplication;
export { TicketRow, TicketList };
