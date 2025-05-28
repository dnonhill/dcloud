import { Button, Column, Columns, Control, Field, Label } from 'bloomer';
import { Form, Formik } from 'formik';
import React from 'react';
import { useCookies } from 'react-cookie';
import { useDispatch } from 'react-redux';

import {
  DEFAULT_ADMIN_QUERY_OPTIONS,
  setQueryFilter,
  setQueryPagination,
  useQueryOptions,
} from '../../api/list-options';
import resourceApi from '../../api/resource';
import { DeferRender, Pagination, useDebounce } from '../../components';
import { CheckboxGroup, Input } from '../../components/formik';
import { RESOURCE_TYPE_CONTAINER } from '../../resource-type';
import { ResourceList } from '../resources/list';
import ActiveFilter from './active-filter';
import { SearchSummary } from './summary';

interface ResourceSearchOption {
  all?: boolean;
  status?: string;
  name__contains?: string;
  resource_type__in: string[];
  job_code__contains?: string;
  ip_address?: string;
}

const DEFAULT_RESOURCE_SEARCH_OPTION: ResourceSearchOption = {
  all: true,
  status: 'active',
  resource_type__in: [],
};

const SearchPane: React.FC<{ onSearch: (data: {}) => void }> = ({ onSearch }) => {
  const [cookie] = useCookies();
  const handleSearch = (values: ResourceSearchOption) => {
    onSearch({
      ...values,
      resource_type__in: values.resource_type__in.join(','),
    });
  };

  return (
    <Formik onSubmit={handleSearch} initialValues={cookie.filterResource || DEFAULT_RESOURCE_SEARCH_OPTION}>
      <Form data-form="search">
        <Field>
          <Label>Resource Name</Label>
          <Control>
            <Input name="name__contains" />
          </Control>
        </Field>

        <Field>
          <Control>
            <CheckboxGroup
              name="resource_type__in"
              choices={{
                'Virtual Machine': 'vm',
                'Openshift Project': RESOURCE_TYPE_CONTAINER,
              }}
            />
          </Control>
        </Field>

        <Field>
          <Label>Job Code</Label>
          <Control>
            <Input name="job_code__contains" />
          </Control>
        </Field>
        <Field>
          <Label>IP Address</Label>
          <Control>
            <Input name="ip_address" />
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

export const SearchResource: React.FC = () => {
  const dispatch = useDispatch();
  const { queryOptions, dispatchQuery, queryParams } = useQueryOptions(DEFAULT_ADMIN_QUERY_OPTIONS);
  const debouncedParams = useDebounce(queryParams);
  const [cookie, setCookie] = useCookies();

  const loader = React.useMemo(() => {
    if (cookie.filterResource) {
      dispatchQuery(
        setQueryFilter({ ...cookie.filterResource, resource_type__in: cookie.filterResource.resource_type__in.join() }),
      );
    }
    return resourceApi(dispatch).list(debouncedParams);
  }, [cookie.filterResource, dispatch, debouncedParams, dispatchQuery]);

  return (
    <Columns>
      <Column isSize="1/4">
        <SearchPane
          onSearch={(filter: any) => {
            setCookie(
              'filterResource',
              { ...filter, resource_type__in: filter.resource_type__in.split(',') },
              { expires: genExpired() },
            );
            // dispatchQuery(setQueryFilter(filter));
          }}
        />
      </Column>
      <Column isSize="3/4">
        <DeferRender
          promise={loader}
          render={(response) => (
            <>
              <SearchSummary count={response.count} results={response.results} />
              <ResourceList isReadOnly={true} isSearch={true} items={response.results} />
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
