import { Button, Column, Columns, Control, Field, Label, Level, LevelLeft, LevelRight } from 'bloomer';
import { Form, Formik } from 'formik';
import React from 'react';
import { useCookies } from 'react-cookie';
import { useDispatch } from 'react-redux';

import applicationApi from '../../api/application';
import {
  DEFAULT_PAGINATION,
  OrderDirection,
  QueryOptions,
  setQueryFilter,
  setQueryOrdering,
  setQueryPagination,
  useQueryOptions,
} from '../../api/list-options';
import { DeferRender, Pagination, SortPane, useDebounce } from '../../components';
import { Input } from '../../components/formik';
import { ApplicationList } from '../applications/list';
import ActiveFilter from './active-filter';
import { SearchSummary } from './summary';

interface ApplicationSearchOption {
  all?: boolean;
  name__icontains?: string;
  supporter_name__icontains?: string;
  status: string;
}

const DEFAULT_APPLICATION_SEARCH_OPTION: ApplicationSearchOption = { all: true, status: 'active' };

const SearchPane: React.FC<{ onSearch: (data: {}) => void }> = ({ onSearch }) => {
  const [cookie] = useCookies();

  return (
    <Formik onSubmit={onSearch} initialValues={cookie.filterApplication || DEFAULT_APPLICATION_SEARCH_OPTION}>
      <Form data-form="search">
        <Field>
          <Label>Application Name</Label>
          <Control>
            <Input name="name__icontains" />
          </Control>
        </Field>
        <Field>
          <Label>Application supporter</Label>
          <Control>
            <Input name="supporter_name__icontains" />
          </Control>
        </Field>
        <Field>
          <Control>
            <ActiveFilter name="status" />
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

const ORDERING_FIELD = 'created_at';
const DEFAULT_QUERY_OPTIONS: QueryOptions = {
  paginate: DEFAULT_PAGINATION,
  order: { field: ORDERING_FIELD, direction: 'DSC' },
  filter: DEFAULT_APPLICATION_SEARCH_OPTION,
};

export const SearchApplication: React.FC = () => {
  const dispatch = useDispatch();
  const { queryOptions, dispatchQuery, queryParams } = useQueryOptions(DEFAULT_QUERY_OPTIONS);
  const debouncedParams = useDebounce(queryParams);
  const [cookie, setCookie] = useCookies();

  const setOrder = (direction: OrderDirection) => {
    dispatchQuery(setQueryOrdering({ field: ORDERING_FIELD, direction: direction }));
  };

  const loader = React.useMemo(() => {
    if (cookie.filterApplication) {
      dispatchQuery(setQueryFilter(cookie.filterApplication));
    }

    return applicationApi(dispatch).list(undefined, debouncedParams);
  }, [cookie.filterApplication, dispatch, debouncedParams, dispatchQuery]);

  return (
    <Columns>
      <Column isSize="1/4">
        <SearchPane
          onSearch={(filter) => {
            setCookie('filterApplication', filter, { expires: genExpired() });
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
              <ApplicationList isReadOnly={true} isSearch={true} items={response.results} />
              <Pagination
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
  );
};

function genExpired() {
  const now = new Date();
  now.setTime(now.getTime() + 30 * 60 * 1000);
  return now;
}
