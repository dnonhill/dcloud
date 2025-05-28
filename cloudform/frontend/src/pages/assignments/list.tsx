import { Box, Level, LevelLeft, LevelRight, Subtitle, Title } from 'bloomer';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import assignmentApi from '../../api/assignment';
import { buildListingParams, DEFAULT_PAGINATION, OrderDirection } from '../../api/list-options';
import { TicketBriefResponse } from '../../api/ticket';
import { ReactComponent as NoData } from '../../asset/no_data.svg';
import {
  AppHeader,
  AppSubTitle,
  AppTitle,
  ContentWrapper,
  DeferRender,
  IllustratedPage,
  Pagination,
  SearchPane,
  SortPane,
  useDebounce,
} from '../../components';
import { displayRelativeDate } from '../../formatter/date';

const AssignmentListPage: React.FC = () => {
  const dispatch = useDispatch();

  const [ticketKeyword, setTicketKeyword] = React.useState('');
  const [paginationOption, setPaginationOption] = React.useState(DEFAULT_PAGINATION);
  const [sortDirection, setSortDirection] = React.useState<OrderDirection>('ASC');

  const listingOption = useDebounce(
    React.useMemo<any>(() => {
      return buildListingParams(paginationOption, { field: 'created_at', direction: sortDirection }, [
        { field: 'ticket_no__startswith', value: ticketKeyword },
      ]);
    }, [paginationOption, ticketKeyword, sortDirection]),
  );

  const ticketsLoader = React.useMemo(() => {
    return assignmentApi(dispatch).listApprovedTicket(listingOption);
  }, [dispatch, listingOption]);

  return (
    <>
      <AppHeader>
        <AppTitle>Dispatch tickets</AppTitle>
        <AppSubTitle>Assign tickets to operator.</AppSubTitle>
      </AppHeader>
      <ContentWrapper>
        <Level>
          <LevelLeft>
            <SearchPane displayName="Ticket no." onSearch={setTicketKeyword} />
          </LevelLeft>
          <LevelRight>
            <SortPane
              initial={sortDirection}
              onDirectionChange={setSortDirection}
              descendingLabel="Newest first"
              ascendingLabel="Oldest first"
            />
          </LevelRight>
        </Level>

        <DeferRender
          promise={ticketsLoader}
          render={(response) => (
            <>
              <AssignmentList tickets={response.results} searchMode={listingOption.ticket_no__startswith !== ''} />
              <Pagination
                response={response}
                onPageChange={setPaginationOption}
                currentPage={paginationOption.currentPage}
                itemPerPage={paginationOption.itemPerPage}
              />
            </>
          )}
        />
      </ContentWrapper>
    </>
  );
};

interface AssignmentListProps {
  tickets: TicketBriefResponse[];
  searchMode: boolean;
}

const AssignmentList: React.FC<AssignmentListProps> = (props) => {
  if (props.tickets.length > 0) {
    return (
      <section className="ticket-items">
        {props.tickets.map((ticket) => (
          <TicketRow ticket={ticket} key={ticket.id} />
        ))}
      </section>
    );
  } else if (!props.searchMode) {
    return (
      <IllustratedPage>
        <NoData />
        <Title>All tickets has been dispatched.</Title>
        <Subtitle>Thank you for your cooperation.</Subtitle>
      </IllustratedPage>
    );
  } else {
    return (
      <IllustratedPage>
        <NoData />
        <Title>No data matching with your search.</Title>
      </IllustratedPage>
    );
  }
};

export const TicketRow: React.FC<{ ticket: TicketBriefResponse }> = ({ ticket }) => (
  <Box className="ticket">
    <Level>
      <LevelLeft>
        <p>
          <Link to={`/assignments/${ticket.id}`}>
            <strong data-field="ticketNo">{ticket.ticketNo}</strong>
          </Link>
          <br />
          <small>
            {ticket.project.name}&nbsp;/&nbsp;{ticket.application.name}
          </small>
        </p>
      </LevelLeft>
      <LevelRight>
        <p className="has-text-grey">
          <small>Requested at {displayRelativeDate(ticket.createdAt)}</small>
        </p>
      </LevelRight>
    </Level>
  </Box>
);

export default AssignmentListPage;
