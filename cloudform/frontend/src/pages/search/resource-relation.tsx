import { Box, Button, Column, Columns, Control, Field, Icon, Label, Level, LevelLeft, LevelRight, Tag } from 'bloomer';
import { Form, Formik } from 'formik';
import React, { useState } from 'react';
import { useCookies } from 'react-cookie';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import Select, { OptionTypeBase } from 'react-select';

import {
  DEFAULT_ADMIN_QUERY_OPTIONS,
  setQueryFilter,
  setQueryPagination,
  useQueryOptions,
} from '../../api/list-options';
import resourceApi, { ResourceRelationProperty, ServiceInventoryProperty } from '../../api/resource';
import { DeferRender, Pagination, useDebounce } from '../../components';
import { CheckboxGroup } from '../../components/formik';
import { ItemsNotFound } from '../../components/illustration';
import { Tooltip } from '../../components/tooltip';
import ActiveFilter from './active-filter';
import { SearchSummary } from './summary';

interface ResourceRelationSearchOption {
  all?: boolean;
  service_inventory?: number;
  resource_status: string;
  relation__in: string[];
}

const defaultSearchOption: ResourceRelationSearchOption = {
  all: true,
  resource_status: 'active',
  relation__in: [],
  service_inventory: undefined,
};

interface SearchPaneProps {
  onSearch: (data: any) => void;
  serviceInventories: ServiceInventoryProperty[];
}

const SearchPane: React.FC<SearchPaneProps> = (props) => {
  const { serviceInventories } = props;
  const serviceOptions = React.useMemo(() => serviceInventories.map((val) => ({ value: val.id, label: val.name })), [
    serviceInventories,
  ]);
  const [cookie] = useCookies();

  const handleSearch = (values: ResourceRelationSearchOption) => {
    props.onSearch({
      ...values,
      relation__in: values.relation__in.join(','),
    });
  };

  return (
    <Formik initialValues={cookie.filterResourceRel || defaultSearchOption} onSubmit={handleSearch}>
      {({ values, setFieldValue }) => (
        <Form data-form="search">
          <Field>
            <Label>Service</Label>
            <Control>
              <Select
                name="service_inventory"
                value={serviceOptions.find((item) => item.value === values.service_inventory)}
                options={serviceOptions}
                placeholder="Select service..."
                onChange={(v) => setFieldValue('service_inventory', v && (v as OptionTypeBase).value)}
              />
            </Control>
          </Field>
          <Field>
            <Label>Direction</Label>
            <Control>
              <CheckboxGroup
                name="relation__in"
                choices={{
                  Inbound: 'inbound',
                  Outbound: 'outbound',
                }}
              />
            </Control>
          </Field>
          <Field>
            <Label>Status</Label>
            <Control>
              <ActiveFilter name="resource_status" />
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
      )}
    </Formik>
  );
};

interface RelationRecordProps {
  item: ResourceRelationProperty;
}

const RelationRecord: React.FC<RelationRecordProps> = (props) => {
  const { item } = props;
  const iconClass = item.relation === 'inbound' ? 'fa-arrow-right' : 'fa-arrow-left';
  return (
    <Box>
      <Level>
        <LevelLeft>
          <div>
            <p>
              <span>Application</span>&nbsp;
              <span className="has-text-primary has-text-weight-bold">
                <Link to={`/applications/${item.application}?isReadOnly=true`}>{item.applicationName}</Link>
              </span>
            </p>
            <span className="is-size-7">
              <Tooltip text={item.serviceInventoryName} tooltipText={item.serviceInventoryDescription} />
              <Link to={`/resources/${item.resource}/relation?isReadOnly=true`}>
                <Icon className={`fas ${iconClass}`} />
                <span className="has-text-primary">{item.resourceName}</span>
                {item.resourceActiveFlag || <Tag color="grey">ARCHIVED</Tag>}
              </Link>
            </span>
          </div>
        </LevelLeft>
        <LevelRight>
          <Tag className={'is-light'} isColor="primary">
            {item.relation.toUpperCase()}
          </Tag>
        </LevelRight>
      </Level>
    </Box>
  );
};

export const ResourceRelationList: React.FC<{ items: ResourceRelationProperty[] }> = ({ items }) => {
  if (items.length <= 0) return <ItemsNotFound title="Cannot find matched resource relation." />;

  return (
    <>
      {items.map((item) => (
        <RelationRecord item={item} key={item.id} />
      ))}
    </>
  );
};

export const SearchResourceRelation: React.FC = () => {
  const dispatch = useDispatch();
  const { queryOptions, dispatchQuery, queryParams } = useQueryOptions(DEFAULT_ADMIN_QUERY_OPTIONS);
  const debouncedParams = useDebounce(queryParams);
  const [serviceInventories, setServiceInventories] = useState<ServiceInventoryProperty[]>([]);
  const [cookie, setCookie] = useCookies();
  //Load service inventories.
  React.useEffect(() => {
    resourceApi(dispatch)
      .listServiceInventory()
      .then((response) => setServiceInventories(response.results));
  }, [dispatch]);

  const loader = React.useMemo(() => {
    if (cookie.filterResourceRel) {
      dispatchQuery(setQueryFilter(cookie.filterResourceRel));
    }
    return resourceApi(dispatch).listAppRelation(debouncedParams);
  }, [cookie.filterResourceRel, dispatch, debouncedParams, dispatchQuery]);

  return (
    <>
      <Columns>
        <Column isSize="1/4">
          <SearchPane
            serviceInventories={serviceInventories}
            onSearch={(filter) => {
              setCookie('filterResourceRel', filter, { expires: genExpired() });
              dispatchQuery(setQueryFilter(filter));
            }}
          />
        </Column>
        <Column isSize="3/4">
          <DeferRender
            promise={loader}
            render={(response) => (
              <>
                <SearchSummary count={response.count} results={response.results} />
                <ResourceRelationList items={response.results} />
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
    </>
  );
};
function genExpired() {
  const now = new Date();
  now.setTime(now.getTime() + 30 * 60 * 1000);
  return now;
}
