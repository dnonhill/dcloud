import { Box, Level, LevelItem, LevelLeft, LevelRight, Select, Tag, Title } from 'bloomer';
import { DateTime } from 'luxon';
import * as React from 'react';
import * as Redux from 'react-redux';
import { Link } from 'react-router-dom';

import assigmentApi, { AssignmentResponse } from '../../api/assignment';
import { buildListingParams, DEFAULT_PAGINATION, OrderDirection } from '../../api/list-options';
import { ReactComponent as NoData } from '../../asset/no_data.svg';
import {
  AppHeader,
  AppTitle,
  ContentWrapper,
  DeferRender,
  IllustratedPage,
  SearchPane,
  SortPane,
  useDebounce,
} from '../../components';
import PaginationContainer from '../../components/pagination';
import { displayRelativeDate } from '../../formatter/date';

function isOverdue(referenceTime: string) {
  return DateTime.fromISO(referenceTime) < DateTime.local().minus({ days: 1 });
}

const AssignmentRow: React.FC<{ assignment: AssignmentResponse }> = ({ assignment }) => (
  <Box className="assignment-item" data-value={assignment.id}>
    <Level>
      <LevelLeft>
        <div>
          <Link to={`/my-assignments/${assignment.id}`}>
            <strong data-field="ticket.no">{assignment.ticket.ticketNo}</strong>
          </Link>
          &nbsp;
          {assignment.activeFlag ? (
            isOverdue(assignment.createdAt) && (
              <Tag isColor="danger" className="is-light">
                OVERDUE
              </Tag>
            )
          ) : (
            <Tag isColor="success" className="is-light">
              COMPLETED
            </Tag>
          )}
          <br />
          <small>
            {assignment.ticket.project.name}
            &nbsp;/&nbsp;
            {assignment.ticket.application.name}
          </small>
        </div>
      </LevelLeft>
      <LevelRight>
        <span className="has-text-grey">
          <small>Assigned&nbsp;{displayRelativeDate(assignment.createdAt)}</small>
        </span>
      </LevelRight>
    </Level>
  </Box>
);

interface AssignmentsListProps {
  assignments: AssignmentResponse[];
  isSearchMode: boolean;
}

const AssignmentsList: React.FC<AssignmentsListProps> = (props) => {
  if (props.assignments.length > 0) {
    return (
      <div className="assignment-items">
        {props.assignments.map((assignment) => (
          <AssignmentRow assignment={assignment} key={assignment.id} />
        ))}
      </div>
    );
  } else {
    return (
      <IllustratedPage>
        <NoData />
        <Title>
          {props.isSearchMode ? (
            <span>Cannot find matched ticket.</span>
          ) : (
            <span>You have accomplished all tasks!</span>
          )}
        </Title>
      </IllustratedPage>
    );
  }
};

interface StatusFilterProps {
  onFilterChange: (value: string) => void;
  initialValue: string;
}

const StatusFilter: React.FC<StatusFilterProps> = (props) => {
  const [value, setValue] = React.useState(props.initialValue);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.currentTarget.value;
    if (selectedValue !== value) {
      setValue(selectedValue);
      props.onFilterChange(selectedValue);
    }
  };

  return (
    <Select value={value} onChange={onChange}>
      <option value="all">All</option>
      <option value="active">Active</option>
      <option value="archived">Archived</option>
    </Select>
  );
};

const ListAssignmentsPage: React.FC = () => {
  const dispatch = Redux.useDispatch();
  const [pagination, setPagination] = React.useState(DEFAULT_PAGINATION);
  const [sortDirection, setSortDirection] = React.useState<OrderDirection>('ASC');
  const [ticketKeyword, setTicketKeyword] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('active');

  const listingOptions = useDebounce(
    React.useMemo(
      () =>
        buildListingParams(pagination, { field: 'created_at', direction: sortDirection }, [
          { field: 'ticket__ticket_no__startswith', value: ticketKeyword },
          { field: 'status', value: statusFilter },
        ]),
      [pagination, sortDirection, ticketKeyword, statusFilter],
    ),
  );

  const assignmentsLoader = React.useMemo(() => {
    return assigmentApi(dispatch).list(listingOptions);
  }, [dispatch, listingOptions]);

  const isSearchMode = !(ticketKeyword === '' && statusFilter === 'active');

  return (
    <>
      <AppHeader>
        <AppTitle>My Tickets</AppTitle>
      </AppHeader>
      <ContentWrapper>
        <Level>
          <LevelLeft>
            <LevelItem>
              <StatusFilter onFilterChange={setStatusFilter} initialValue="active" />
            </LevelItem>
            <LevelItem>
              <SearchPane onSearch={setTicketKeyword} displayName="Ticket No" />
            </LevelItem>
          </LevelLeft>
          <LevelRight>
            <SortPane
              onDirectionChange={setSortDirection}
              initial={sortDirection}
              descendingLabel="Newest first"
              ascendingLabel="Oldest first"
            />
          </LevelRight>
        </Level>
        <DeferRender
          promise={assignmentsLoader}
          render={(response) => (
            <>
              <AssignmentsList assignments={response.results} isSearchMode={isSearchMode} />
              <PaginationContainer
                itemPerPage={pagination.itemPerPage}
                currentPage={pagination.currentPage}
                response={response}
                onPageChange={setPagination}
              />
            </>
          )}
        />
      </ContentWrapper>
    </>
  );
};

export default ListAssignmentsPage;
