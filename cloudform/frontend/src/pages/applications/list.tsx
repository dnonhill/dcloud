import { Box, Button, Icon, Level, LevelItem, LevelLeft, LevelRight, Subtitle, Tag, Title } from 'bloomer';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { Link, useRouteMatch } from 'react-router-dom';

import applicationApi, { ApplicationResponse } from '../../api/application';
import {
  DEFAULT_PAGINATION,
  QueryOptions,
  setQueryFilter,
  setQueryPagination,
  useQueryOptions,
} from '../../api/list-options';
import { ReactComponent as BlankCanvas } from '../../asset/blank_canvas.svg';
import { DeferRender, IllustratedPage, LinkButton, useDebounce } from '../../components';
import { ItemsNotFound } from '../../components/illustration';
import PaginationContainer from '../../components/pagination';

const ApplicationItem: React.FC<{ item: ApplicationResponse; isReadOnly: boolean }> = ({
  item,
  isReadOnly = false,
}) => {
  return (
    <Box className="application-item">
      <Link to={`/applications/${item.id}` + (isReadOnly ? '?isReadOnly=true' : '')}>
        <strong>{item.name}</strong>
      </Link>
      &nbsp;
      {item.activeFlag || <Tag>ARCHIVED</Tag>}
      <br />
      <small className="is-family-secondary">
        {item.supporterName}, {item.supporterOrganization}
      </small>
    </Box>
  );
};

const NewApplicationButton: React.FC = () => {
  const match = useRouteMatch()!;
  return (
    <LinkButton
      to={`${match.url}/applications/new`}
      icon="fa fa-plus"
      isColor="info"
      className="is-rounded"
      data-action="new-application"
    >
      <span>New Application</span>
    </LinkButton>
  );
};

const CreateFirstApplication: React.FC = () => (
  <IllustratedPage>
    <BlankCanvas />
    <Title>Create your first application.</Title>
    <Subtitle>
      Create your application to logical separate your project into manageable unit and create resources under it.
    </Subtitle>
    <NewApplicationButton />
  </IllustratedPage>
);

interface ApplicationListProps {
  items: ApplicationResponse[];
  isSearch?: boolean;
  isReadOnly?: boolean;
}

const ApplicationList: React.FC<ApplicationListProps> = (props) => {
  const { items, isSearch = false, isReadOnly = false } = props;

  if (items.length <= 0) {
    if (isSearch) {
      return <ItemsNotFound title="Cannot find matched applications." />;
    } else {
      return isReadOnly ? <ItemsNotFound title="No Application here." /> : <CreateFirstApplication />;
    }
  }

  return (
    <div className="application-items">
      {items.map((app) => (
        <ApplicationItem item={app} key={app.id} isReadOnly={isReadOnly} />
      ))}
    </div>
  );
};

interface ApplicationsByProjectProps {
  projectId: string | number;
  isReadOnly?: boolean;
}

const DEFAULT_QUERY_OPTION: QueryOptions = {
  filter: { status: 'active' },
  paginate: DEFAULT_PAGINATION,
};

const ApplicationsByProject: React.FC<ApplicationsByProjectProps> = ({ projectId, isReadOnly = false }) => {
  const dispatch = useDispatch();
  const { queryOptions, dispatchQuery, queryParams } = useQueryOptions(DEFAULT_QUERY_OPTION);
  const debouncedParams = useDebounce(queryParams);

  const loader = React.useMemo(() => {
    let param = debouncedParams;
    if (isReadOnly) param = { ...debouncedParams, all: true };
    return applicationApi(dispatch).list(projectId, param);
  }, [debouncedParams, isReadOnly, dispatch, projectId]);

  const showingArchived = queryOptions.filter.status !== 'active';

  return (
    <>
      <Level>
        <LevelLeft>
          <LevelItem>
            <Title isSize={5}>Applications</Title>
          </LevelItem>
          {showingArchived && (
            <LevelItem>
              <Button
                isSize="small"
                className="is-rounded"
                onClick={() => dispatchQuery(setQueryFilter({ status: 'active' }))}
              >
                <Icon className="fas fa-archive has-text--grey-light" />
                <span>Hide archived</span>
              </Button>
            </LevelItem>
          )}
          {showingArchived || (
            <LevelItem>
              <Button isSize="small" className="is-rounded" onClick={() => dispatchQuery(setQueryFilter({}))}>
                <Icon className="fas fa-archive" />
                <span>Show archived</span>
              </Button>
            </LevelItem>
          )}
        </LevelLeft>
        <LevelRight>
          {isReadOnly || (
            <LevelItem>
              <NewApplicationButton />
            </LevelItem>
          )}
        </LevelRight>
      </Level>

      <DeferRender
        promise={loader}
        render={(response) => (
          <>
            <ApplicationList items={response.results} isReadOnly={isReadOnly} />
            <PaginationContainer
              response={response}
              currentPage={queryOptions.paginate.currentPage}
              itemPerPage={queryOptions.paginate.itemPerPage}
              onPageChange={(paginate) => dispatchQuery(setQueryPagination(paginate))}
            />
          </>
        )}
      />
    </>
  );
};

export { ApplicationsByProject, ApplicationList };
