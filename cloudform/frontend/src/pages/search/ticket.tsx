import {
  Box,
  Button,
  Column,
  Columns,
  Control,
  Field,
  Label,
  Level,
  LevelItem,
  LevelLeft,
  LevelRight,
  Tag,
} from 'bloomer';
import { Form, Formik } from 'formik';
import React from 'react';
import { useCookies } from 'react-cookie';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import {
  DEFAULT_PAGINATION,
  OrderDirection,
  QueryOptions,
  setQueryFilter,
  setQueryOrdering,
  setQueryPagination,
  useQueryOptions,
} from '../../api/list-options';
import ticketApi, { TicketBriefResponse } from '../../api/ticket';
import { DeferRender, SortPane, useDebounce } from '../../components';
import { Input, Select } from '../../components/formik';
import { ItemsNotFound } from '../../components/illustration';
import PaginationContainer from '../../components/pagination';
import { displayRelativeDate } from '../../formatter/date';
import { STATUS_COLOR_MAP, STATUS_TEXT_MAP } from '../tickets/formatter';
import { SearchSummary } from './summary';

interface TicketSearchOption {
  all?: boolean;
  ticket_no__contains?: string;
  status?: string;
}

const INITIAL_SEARCH_OPTIONS: TicketSearchOption = {
  all: true,
  ticket_no__contains: '',
  status: '',
};

const SearchPane: React.FC<{ onSearch: (data: {}) => void }> = ({ onSearch }) => {
  const [cookie] = useCookies();
  return (
    <Formik initialValues={cookie.filterTicket || INITIAL_SEARCH_OPTIONS} onSubmit={onSearch}>
      <Form data-form="search">
        <Field>
          <Label>Ticket Number</Label>
          <Control>
            <Input name="ticket_no__contains" />
          </Control>
        </Field>
        <Field>
          <Label>Requestor Name</Label>
          <Control>
            <Input name="fullname" />
          </Control>
        </Field>
        <Field>
          <Label>Operator Name</Label>
          <Control>
            <Input name="operator_name" />
          </Control>
        </Field>
        <Field>
          <Label>Status</Label>
          <Control>
            <Select name="status">
              <option value="all">All</option>
              <option value="created">New</option>
              <option value="approved">Approved</option>
              <option value="assigned">In Progress</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
              <option value="feedback_applied">Feedback Applied</option>
              <option value="commented">Commented</option>
              <option value="reviewed">Reviewed</option>
            </Select>
          </Control>
        </Field>
        <Field>
          <Control>
            <Button type="submit" data-action="search">
              Search
            </Button>
          </Control>
        </Field>
      </Form>
    </Formik>
  );
};

export const TicketRow: React.FC<{ ticket: TicketBriefResponse }> = (props) => {
  const { ticket } = props;

  return (
    <Box data-id={ticket.id} className="ticket">
      <Level>
        <LevelLeft>
          <LevelItem>
            <div>
              <small className="is-family-secondary">TICKET NO</small>&nbsp;
              <Link to={`tickets/${ticket.id}/redirect`}>
                <strong data-field="ticket-no">{ticket.ticketNo}</strong>
              </Link>
              &nbsp;
              <Tag isColor={STATUS_COLOR_MAP[ticket.status] || 'info'} data-field="status">
                {STATUS_TEXT_MAP[ticket.status]}
              </Tag>
              <br />
              <small className="has-text-grey is-family-secondary">PROJECT:&nbsp;{ticket.project.name}</small>
            </div>
          </LevelItem>
          <LevelItem></LevelItem>
        </LevelLeft>
        <LevelRight className="has-text-grey">
          <LevelItem>
            <span className="is-family-secondary is-size-7 has-text-right">
              Requested {displayRelativeDate(ticket.createdAt)}
              <br />
              by {ticket.createdBy.fullname || ticket.createdBy.username}
              <br />
              {ticket?.assignments && ticket?.assignments.length ? (
                <>Assigned to {ticket?.assignments?.[0]?.assignee?.fullname}</>
              ) : null}
            </span>
          </LevelItem>
        </LevelRight>
      </Level>
    </Box>
  );
};

export const SearchResult: React.FC<{ tickets: TicketBriefResponse[] }> = (props) => {
  const { tickets } = props;

  if (tickets.length > 0) {
    return (
      <div className="tickets-container">
        {tickets.map((ticket) => (
          <TicketRow ticket={ticket} key={ticket.id} />
        ))}
      </div>
    );
  } else {
    return <ItemsNotFound title="Cannot find matched tickets." />;
  }
};

const ORDERING_FIELD = 'created_at';
const DEFAULT_QUERY_OPTIONS: QueryOptions = {
  paginate: DEFAULT_PAGINATION,
  filter: INITIAL_SEARCH_OPTIONS,
  order: { field: ORDERING_FIELD, direction: 'DSC' },
};

export const SearchTicket: React.FC = () => {
  const dispatch = useDispatch();
  const { queryOptions, dispatchQuery, queryParams } = useQueryOptions(DEFAULT_QUERY_OPTIONS);
  const debouncedParams = useDebounce(queryParams);
  const [cookie, setCookie] = useCookies();

  const setOrder = (direction: OrderDirection) => {
    dispatchQuery(
      setQueryOrdering({
        field: ORDERING_FIELD,
        direction: direction,
      }),
    );
  };

  const loader = React.useMemo(() => {
    if (cookie.filterTicket) {
      dispatchQuery(setQueryFilter(cookie.filterTicket));
    }
    return ticketApi(dispatch).list(debouncedParams);
  }, [cookie.filterTicket, dispatch, debouncedParams, dispatchQuery]);

  return (
    <>
      <Columns>
        <Column isSize="1/4">
          <SearchPane
            onSearch={(filter) => {
              setCookie('filterTicket', filter, { expires: genExpired() });
              dispatchQuery(setQueryFilter(filter));
            }}
          />
        </Column>
        <Column isSize="3/4">
          <Level>
            <LevelLeft />
            <LevelRight>
              <SortPane
                onDirectionChange={setOrder}
                initial={DEFAULT_QUERY_OPTIONS.order!.direction}
                descendingLabel="Newest first"
                ascendingLabel="Oldest first"
              />
            </LevelRight>
          </Level>
          <DeferRender
            promise={loader}
            render={(response) => (
              <>
                <SearchSummary count={response.count} results={response.results} />
                <SearchResult tickets={response.results} />
                <PaginationContainer
                  response={response}
                  itemPerPage={queryOptions.paginate.itemPerPage}
                  currentPage={queryOptions.paginate.currentPage}
                  onPageChange={(paginate) => dispatchQuery(setQueryPagination(paginate))}
                />
              </>
            )}
          />
        </Column>
      </Columns>
    </>
  );
};
function genExpired() {
  const now = new Date();
  now.setTime(now.getTime() + 30 * 60 * 1000);
  return now;
}
