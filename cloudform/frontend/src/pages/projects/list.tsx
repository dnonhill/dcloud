import { Box, Button, Icon, Level, LevelItem, LevelLeft, LevelRight, Subtitle, Tag, Title } from 'bloomer';
import { isEmpty } from 'lodash';
import { DateTime } from 'luxon';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { Link, useRouteMatch } from 'react-router-dom';

import {
  DEFAULT_PAGINATION,
  OrderDirection,
  QueryOptions,
  setQueryOrdering,
  setQueryPagination,
  updateQueryFilter,
  useQueryOptions,
} from '../../api/list-options';
import projectApi, { ProjectResponse } from '../../api/project';
import { ReactComponent as BlankCanvas } from '../../asset/blank_canvas.svg';
import {
  AppHeader,
  AppTitle,
  ContentWrapper,
  DeferRender,
  IllustratedPage,
  LinkButton,
  Pagination,
  SearchPane,
  SortPane,
  useDebounce,
} from '../../components';
import { ItemsNotFound } from '../../components/illustration';

const NewProjectButton: React.FC = () => {
  const match = useRouteMatch()!;
  return (
    <LinkButton
      icon="fa fa-plus"
      to={`${match.url}/new`}
      isColor="info"
      className="is-rounded"
      data-action="new-project"
    >
      <span>New Project</span>
    </LinkButton>
  );
};

const CreateFirstProject: React.FC = () => (
  <IllustratedPage>
    <BlankCanvas />
    <Title>Create your first project.</Title>
    <Subtitle>Create your project for manage applications and resources.</Subtitle>
    <NewProjectButton />
  </IllustratedPage>
);

const ProjectItem: React.FC<{ item: ProjectResponse; isReadOnly: boolean }> = ({ item, isReadOnly }) => {
  const todayUTC = DateTime.local().startOf('day').toISO();
  return (
    <Box className="project-item" data-id={item.id}>
      <Link to={`/projects/${item.id}` + (isReadOnly ? '?isReadOnly=true' : '')}>
        <strong>{item.name}</strong>
      </Link>
      &nbsp;
      {todayUTC && todayUTC >= item.expiredDate ? (
        <Tag className="is-light" isColor="danger">
          EXPIRED
        </Tag>
      ) : (
        ''
      )}
      {item.activeFlag || <Tag isColor="is-grey">ARCHIVED</Tag>}
      <br />
      <small className="is-family-secondary">JOB CODE: {item.jobCode}</small>
    </Box>
  );
};

interface ProjectListProps {
  items: ProjectResponse[];
  isSearch?: boolean;
  isReadOnly?: boolean;
}

export const ProjectList: React.FC<ProjectListProps> = ({ isReadOnly = false, isSearch, items }) => {
  if (items.length <= 0)
    return isSearch ? <ItemsNotFound title="Cannot find matched projects." /> : <CreateFirstProject />;

  return (
    <div className="project-items">
      {items.map((item) => (
        <ProjectItem item={item} key={item.id} isReadOnly={isReadOnly} />
      ))}
    </div>
  );
};

const Header: React.FC = () => (
  <AppHeader>
    <AppTitle>My Projects</AppTitle>
  </AppHeader>
);

const DEFAULT_QUERY_OPTIONS: QueryOptions = {
  filter: { status: 'active' },
  order: { field: 'created_at', direction: 'ASC' },
  paginate: DEFAULT_PAGINATION,
};

const ListProjectsPage = () => {
  const dispatch = useDispatch();
  const { queryOptions, dispatchQuery, queryParams } = useQueryOptions(DEFAULT_QUERY_OPTIONS);
  const debouncedParams = useDebounce(queryParams);
  const onSearch = (filter: string) => dispatchQuery(updateQueryFilter({ name__icontains: filter }));
  const toggleArchived = () =>
    dispatchQuery(updateQueryFilter({ status: queryOptions.filter.status === 'active' ? 'all' : 'active' }));
  const onDirectionChange = (direction: OrderDirection) =>
    dispatchQuery(
      setQueryOrdering({
        field: 'created_at',
        direction,
      }),
    );

  const loader = React.useMemo(() => projectApi(dispatch).list(debouncedParams), [dispatch, debouncedParams]);

  return (
    <>
      <Header />
      <ContentWrapper>
        <Level>
          <LevelLeft>
            <LevelItem>
              <SearchPane displayName="Project name" onSearch={onSearch} />
            </LevelItem>
            <LevelItem>
              <Button onClick={toggleArchived} isSize="small" className="is-rounded">
                <Icon className={`fas fa-archive ${queryOptions.filter.status === 'active' ? '' : 'is-grey'}`} />
                <span>
                  {queryOptions.filter.status === 'active' ? 'Show' : 'Hide'}
                  &nbsp;archive
                </span>
              </Button>
            </LevelItem>
          </LevelLeft>
          <LevelRight>
            <LevelItem>
              <SortPane
                onDirectionChange={onDirectionChange}
                initial="DSC"
                descendingLabel="Newest first"
                ascendingLabel="Oldest first"
              />
            </LevelItem>
            <LevelItem>
              <NewProjectButton />
            </LevelItem>
          </LevelRight>
        </Level>

        <DeferRender
          promise={loader}
          render={(response) => (
            <>
              <ProjectList items={response.results} isSearch={!isEmpty(queryOptions.filter)} />
              <Pagination
                response={response}
                currentPage={queryOptions.paginate.currentPage}
                itemPerPage={queryOptions.paginate.itemPerPage}
                onPageChange={(paginate) => dispatchQuery(setQueryPagination(paginate))}
              />
            </>
          )}
        />
      </ContentWrapper>
    </>
  );
};

export default ListProjectsPage;
