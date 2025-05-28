import { Box, Level, LevelItem, LevelLeft, LevelRight, Subtitle, Tag, Title } from 'bloomer';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';

import approvementApi, { ApprovementBriefProperty } from '../../api/approvement';
import { buildListingParams, DEFAULT_PAGINATION, OrderDirection, PaginationOption } from '../../api/list-options';
import { ReactComponent as EmptyBox } from '../../asset/empty_box.svg';
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

type ApprovementListTableProps = {
  approvements: ApprovementBriefProperty[];
  isShowPending: boolean;
};

const ApprovementsContent: React.FC<ApprovementListTableProps> = (props) => {
  const { approvements, isShowPending } = props;
  if (approvements.length > 0) {
    return (
      <div className="approvement-items">
        {approvements.map((approvement) => (
          <ApprovementItem approvement={approvement} key={approvement.id} />
        ))}
      </div>
    );
  } else if (isShowPending) {
    return (
      <IllustratedPage>
        <EmptyBox />
        <Title>There's not pending ticket right now.</Title>
        <Subtitle>Thank you for your cooperation.</Subtitle>
      </IllustratedPage>
    );
  } else {
    return (
      <IllustratedPage>
        <NoData />
        <Title>No approvement found matching with your search.</Title>
      </IllustratedPage>
    );
  }
};

const ApprovementItem: React.FC<{ approvement: ApprovementBriefProperty }> = ({ approvement }) => (
  <Box className="approvement-item">
    <Level>
      <LevelLeft>
        <LevelItem>
          <div>
            <Link to={`${approvement.id}`}>
              <strong data-field="ticket-no">{approvement.ticketNo}</strong>
              &nbsp;
              {approvement.isApproved != null &&
                (approvement.isApproved ? (
                  <Tag className="is-light" isColor="success">
                    APPROVED
                  </Tag>
                ) : (
                  <Tag className="is-light" isColor="danger">
                    REJECTED
                  </Tag>
                ))}
            </Link>
            <br />
            <small>
              {approvement.projectName}&nbsp;/&nbsp;{approvement.applicationName}
            </small>
          </div>
        </LevelItem>
      </LevelLeft>

      <LevelRight>
        <LevelItem>
          <div className="has-text-right">
            <p>Created {displayRelativeDate(approvement.requestedAt)}</p>
            {approvement.approvedAt && (
              <p className="has-text-grey is-size-7">
                {approvement.isApproved ? 'Approved ' : 'Rejected '}
                {displayRelativeDate(approvement.approvedAt)}
              </p>
            )}
          </div>
        </LevelItem>
      </LevelRight>
    </Level>
  </Box>
);

const MENU = {
  Pending: 'status-pending',
  Approved: 'status-approved',
  Rejected: 'status-rejected',
  All: 'status-all',
};

const ApprovementList: React.FC = () => {
  const dispatch = useDispatch();
  const [ticketKeyword, setTicketKeyword] = React.useState('');
  const [paginationParams, setPaginationParams] = React.useState<PaginationOption>(DEFAULT_PAGINATION);
  const [sortDirection, setSortDirection] = React.useState<OrderDirection>('ASC');
  const { page } = useParams();

  React.useEffect(() => {
    setPaginationParams(DEFAULT_PAGINATION);
  }, [page]);

  const _params = React.useMemo(
    () =>
      buildListingParams(paginationParams, { field: 'requested_at', direction: sortDirection }, [
        { field: page!, value: '1' },
        { field: 'ticket__ticket_no__contains', value: ticketKeyword },
      ]),
    [paginationParams, sortDirection, page, ticketKeyword],
  );
  const params = useDebounce(_params);
  const approvementsLoader = React.useMemo(() => {
    return approvementApi(dispatch).list(params);
  }, [dispatch, params]);

  const isShowPending = page === 'pending' && ticketKeyword === '';
  return (
    <>
      <AppHeader subMenu={MENU}>
        <AppTitle>Approvements</AppTitle>
        <AppSubTitle>We're waiting for your approvements.</AppSubTitle>
      </AppHeader>
      <ContentWrapper>
        <Level>
          <LevelLeft>
            <SearchPane displayName="Ticket No." onSearch={setTicketKeyword} />
          </LevelLeft>
          <LevelRight>
            <LevelItem>
              <SortPane
                onDirectionChange={setSortDirection}
                initial={sortDirection}
                descendingLabel="Newest first"
                ascendingLabel="Oldest first"
              />
            </LevelItem>
          </LevelRight>
        </Level>

        <DeferRender
          promise={approvementsLoader}
          render={(response) => (
            <>
              <ApprovementsContent approvements={response.results} isShowPending={isShowPending} />
              <Pagination
                response={response}
                onPageChange={setPaginationParams}
                currentPage={paginationParams.currentPage}
                itemPerPage={paginationParams.itemPerPage}
              />
            </>
          )}
        />
      </ContentWrapper>
    </>
  );
};

export default ApprovementList;
