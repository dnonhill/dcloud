import { Button, Column, Columns, Control, Field, Label, Level, LevelLeft, LevelRight } from 'bloomer';
import { Form, Formik } from 'formik';
import { DateTime } from 'luxon';
import React from 'react';
import { useCookies } from 'react-cookie';
import { useDispatch } from 'react-redux';

import {
  DEFAULT_PAGINATION,
  OrderDirection,
  QueryOptions,
  setQueryFilter,
  setQueryOrdering,
  setQueryPagination,
  useQueryOptions,
} from '../../api/list-options';
import projectApi from '../../api/project';
import { DeferRender, Pagination, SortPane, useDebounce } from '../../components';
import { Input, Select } from '../../components/formik';
import { ProjectList } from '../projects/list';
import ActiveFilter from './active-filter';
import { SearchSummary } from './summary';

interface ProjectSearchOption {
  all?: boolean;
  name__icontains?: string;
  job_code__contains?: string;
  owner__first_name__icontains?: string;
  isActive: 'active' | 'expired' | 'all';
  status: string;
}

const defaultSearchValues: ProjectSearchOption = {
  all: true,
  name__icontains: '',
  job_code__contains: '',
  owner__first_name__icontains: '',
  isActive: 'all',
  status: 'active',
};

interface SearchPaneProps {
  onSearch: (data: ProjectSearchOption) => void;
}

const SearchPane: React.FC<SearchPaneProps> = (props) => {
  const [cookie] = useCookies();
  // console.log(cookie.filter)

  return (
    <Formik onSubmit={props.onSearch} initialValues={cookie.filterProject || defaultSearchValues}>
      <Form data-form="search">
        <Field>
          <Label>Project Name</Label>
          <Control>
            <Input name="name__icontains" />
          </Control>
        </Field>
        <Field>
          <Label>Job Code</Label>
          <Control>
            <Input name="job_code__contains" />
          </Control>
        </Field>
        <Field>
          <Label>Project Owner</Label>
          <Control>
            <Input name="owner__first_name__icontains" />
          </Control>
        </Field>
        <Field>
          <Label>Status</Label>
          <Control>
            <Select name="isActive">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </Select>
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

function today() {
  return DateTime.local().startOf('day').toISO();
}

const ORDERING_FIELD = 'created_at';
const DEFAULT_QUERY_OPTIONS: QueryOptions = {
  paginate: DEFAULT_PAGINATION,
  order: { field: ORDERING_FIELD, direction: 'DSC' },
  filter: { all: 'true', status: 'active' },
};

export const SearchProject: React.FC = () => {
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
    const { isActive, ...searchParams } = debouncedParams;
    let isActiveParam = {},
      archivedFilterParam = {};

    if (isActive === 'active') {
      isActiveParam = { expired_date__gt: today() };
    } else if (isActive === 'expired') {
      isActiveParam = { expired_date__lte: today() };
    }

    if (cookie.filterProject) {
      dispatchQuery(setQueryFilter(cookie.filterProject));
    }

    return projectApi(dispatch).list({
      ...searchParams,
      ...isActiveParam,
      ...archivedFilterParam,
    });
  }, [debouncedParams, cookie.filterProject, dispatch, dispatchQuery]);

  return (
    <>
      <Columns>
        <Column isSize="1/4">
          <SearchPane
            onSearch={(filter) => {
              setCookie('filterProject', filter, { expires: genExpired() });
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
                <ProjectList isReadOnly={true} isSearch={true} items={response.results} />
                <Pagination
                  response={response}
                  currentPage={queryOptions.paginate.currentPage}
                  itemPerPage={queryOptions.paginate.itemPerPage}
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
