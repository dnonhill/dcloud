import { Box, Button, Field, Icon, Level, LevelItem, LevelLeft, LevelRight, Select, Tag, Title } from 'bloomer';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import { buildListingParams, DEFAULT_PAGINATION, OrderDirection } from '../../api/list-options';
import resourceApi, { ResourceProperty } from '../../api/resource';
import { ReactComponent as EmptyBox } from '../../asset/empty_box.svg';
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
import { RESOURCE_TYPE_CONTAINER } from '../../resource-type';
import ApplicationContext from '../applications/context';
import ApplicationHeader from '../applications/header';
import { ResourceTypeIcon } from './content-extractor';

const NewTicketButton: React.FC<{ isNoResources?: boolean }> = (props) => (
  <LinkButton to="new-ticket" className="is-rounded" isColor="info" data-action="new-ticket">
    <Icon className="fas fa-plus" />
    <span>{props.isNoResources ? 'New resources' : 'More resources'}</span>
  </LinkButton>
);

const ResourceItem: React.FC<{ resource: ResourceProperty; isReadOnly: boolean }> = (props) => {
  const { resource, isReadOnly } = props;
  const linkParam = isReadOnly ? '?isReadOnly=true' : '';
  return (
    <Box>
      <p>
        <Link to={`/resources/${props.resource.id}/spec${linkParam}`}>
          <ResourceTypeIcon resourceType={resource.resourceType} />
          <strong data-field="resource-name">{resource.name}</strong>
        </Link>
        {resource.secondaryName && <span className="has-text-grey"> ({resource.secondaryName})</span>}
        {resource.activeFlag || <Tag color="grey">ARCHIVED</Tag>}
      </p>
      <p>
        <small className="is-family-secondary">
          {resource.dataCenter && resource.dataCenter.name}
          &nbsp;/&nbsp; JOB CODE: {resource.jobCode}
        </small>
      </p>
    </Box>
  );
};

const NoResource: React.FC<{ isReadOnly: boolean }> = ({ isReadOnly }) => (
  <IllustratedPage>
    <EmptyBox />
    <Title>No resources here.</Title>
    {!isReadOnly && (
      <Field isGrouped="centered">
        <NewTicketButton isNoResources={true} />
      </Field>
    )}
  </IllustratedPage>
);

interface ResourceListProps {
  items: ResourceProperty[];
  isReadOnly: boolean;
  isSearch?: boolean;
}

export const ResourceList: React.FC<ResourceListProps> = (props) => {
  const { items, isReadOnly } = props;
  if (items.length <= 0) {
    return props.isSearch ? <ItemsNotFound /> : <NoResource isReadOnly={isReadOnly} />;
  } else {
    return (
      <div className="resources">
        {items.map((resource) => (
          <ResourceItem resource={resource} isReadOnly={isReadOnly} key={resource.id} />
        ))}
      </div>
    );
  }
};

interface TypeFilterProps {
  onTypeSelected: (type: string) => void;
  initialType?: string;
}

const TypeFilter: React.FC<TypeFilterProps> = (props) => {
  const [selectedType, setSelectedType] = React.useState(props.initialType || 'all');
  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.currentTarget.value;
    if (selectedType !== newValue) {
      setSelectedType(newValue);
      props.onTypeSelected(newValue);
    }
  };

  return (
    <Select value={selectedType} onChange={onChange}>
      <option value="all">All Types</option>
      <option value="vm">Virtual machine</option>
      <option value={RESOURCE_TYPE_CONTAINER}>Openshift project</option>
    </Select>
  );
};

interface ToggleArchivedFilterProps {
  showingArchived: boolean;
  onToggled: () => void;
}

const ToggleArchivedFilter: React.FC<ToggleArchivedFilterProps> = (props) => {
  if (props.showingArchived) {
    return (
      <Button isSize="small" className="is-rounded" onClick={() => props.onToggled()}>
        <Icon className="fas fa-archive has-text--grey-light" />
        <span>Hide archived</span>
      </Button>
    );
  } else {
    return (
      <Button isSize="small" className="is-rounded" onClick={() => props.onToggled()}>
        <Icon className="fas fa-archive" />
        <span>Show archived</span>
      </Button>
    );
  }
};

const ResourcesListPage: React.FC<{ isReadOnly: boolean }> = ({ isReadOnly }) => {
  const dispatch = useDispatch();
  const application = React.useContext(ApplicationContext);
  const applicationId = application.id;

  const [nameKeyword, setNameKeyword] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [showingArchived, setShowingArchived] = React.useState(false);
  const [sortDirection, setSortDirection] = React.useState<OrderDirection>('DSC');
  const [pagination, setPagination] = React.useState(DEFAULT_PAGINATION);

  React.useEffect(() => {
    setPagination(DEFAULT_PAGINATION);
  }, [nameKeyword, typeFilter]);

  const listingOption = useDebounce(
    React.useMemo(
      () =>
        buildListingParams(pagination, { field: 'created_at', direction: sortDirection }, [
          { field: 'name__contains', value: nameKeyword },
          { field: 'status', value: showingArchived ? 'all' : 'active' },
          { field: 'resourceType', value: typeFilter === 'all' ? '' : typeFilter },
        ]),
      [pagination, sortDirection, nameKeyword, typeFilter, showingArchived],
    ),
  );

  const resourcesLoader = React.useMemo(() => {
    return resourceApi(dispatch).listByApplication(applicationId, { all: true, ...listingOption });
  }, [dispatch, applicationId, listingOption]);

  const isSearchMode = nameKeyword !== '' || typeFilter !== 'all';

  return (
    <>
      <ApplicationHeader application={application} isReadOnly={isReadOnly} />
      <ContentWrapper>
        <Level>
          <LevelLeft>
            <LevelItem>
              <TypeFilter onTypeSelected={setTypeFilter} />
            </LevelItem>
            <LevelItem>
              <SearchPane displayName="Resource name" onSearch={setNameKeyword} />
            </LevelItem>
            <LevelItem className="is-hidden-desktop-only is-hidden-tablet-only">
              <ToggleArchivedFilter
                showingArchived={showingArchived}
                onToggled={() => {
                  setShowingArchived((prev) => !prev);
                }}
              />
            </LevelItem>
          </LevelLeft>
          <LevelRight>
            <LevelItem className="is-hidden-tablet-only is-hidden-desktop-only">
              <SortPane
                onDirectionChange={setSortDirection}
                initial="DSC"
                descendingLabel="Newest first"
                ascendingLabel="Oldest first"
              />
            </LevelItem>
            {isReadOnly || (
              <LevelItem>
                <NewTicketButton />
              </LevelItem>
            )}
          </LevelRight>
        </Level>
        <DeferRender
          promise={resourcesLoader}
          render={(response) => (
            <>
              <ResourceList items={response.results} isReadOnly={isReadOnly} isSearch={isSearchMode} />
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

export default ResourcesListPage;
