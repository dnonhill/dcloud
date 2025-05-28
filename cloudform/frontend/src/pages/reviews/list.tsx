import { Box, Level, LevelItem, LevelLeft, LevelRight, Subtitle, Tag, Title } from 'bloomer';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';

import { buildListingParams, DEFAULT_PAGINATION, OrderDirection, PaginationOption } from '../../api/list-options';
import reviewApi, { ReviewBriefProperty } from '../../api/review';
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

type ReviewListTableProps = {
  reviews: ReviewBriefProperty[];
  isShowPending: boolean;
};

const ReviewsContent: React.FC<ReviewListTableProps> = (props) => {
  const { reviews, isShowPending } = props;
  if (reviews.length > 0) {
    return (
      <div className="Review-items">
        {reviews.map((review) => (
          <ReviewItem review={review} key={review.id} />
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
        <Title>No Review found matching with your search.</Title>
      </IllustratedPage>
    );
  }
};

const ReviewItem: React.FC<{ review: ReviewBriefProperty }> = ({ review }) => (
  <Box className="Review-item">
    <Level>
      <LevelLeft>
        <LevelItem>
          <div>
            <Link to={`${review.id}`}>
              <strong data-field="ticket-no">{review.ticketNo}</strong>
              &nbsp;
              {review.isReviewed ? (
                <Tag className="is-light" isColor="success">
                  APPROVED
                </Tag>
              ) : review.isReject ? (
                <Tag className="is-light" isColor="danger">
                  REJECTED
                </Tag>
              ) : review.note ? (
                <Tag className="is-light" isColor="warning">
                  COMMENTED
                </Tag>
              ) : (
                ''
              )}
            </Link>
            <br />
            <small>
              {review.projectName}&nbsp;/&nbsp;{review.applicationName}
            </small>
          </div>
        </LevelItem>
      </LevelLeft>

      <LevelRight>
        <LevelItem>
          <div className="has-text-right">
            <p>Created {displayRelativeDate(review.requestedAt)}</p>
            {review.reviewedAt && (
              <p className="has-text-grey is-size-7">
                {review.isReviewed ? 'Approved ' : review.isReject ? 'Rejected ' : 'Commneted '}
                {displayRelativeDate(review.reviewedAt)}
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
  Commented: 'status-commented',
  Rejected: 'status-rejected',
  All: 'status-all',
};

const ReviewsListPage: React.FC = () => {
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
  const reviewsLoader = React.useMemo(() => {
    return reviewApi(dispatch).list(params);
  }, [dispatch, params]);

  const isShowPending = page === 'pending' && ticketKeyword === '';
  return (
    <>
      <AppHeader subMenu={MENU}>
        <AppTitle>Reviews</AppTitle>
        <AppSubTitle>We're waiting for your reviews.</AppSubTitle>
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
          promise={reviewsLoader}
          render={(response) => (
            <>
              <ReviewsContent reviews={response.results} isShowPending={isShowPending} />
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

export default ReviewsListPage;
