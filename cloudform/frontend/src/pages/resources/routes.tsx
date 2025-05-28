import { FormikHelpers } from 'formik';
import React from 'react';
import { useDispatch } from 'react-redux';
import { Redirect, Route, Switch, useHistory, useLocation, useParams, useRouteMatch } from 'react-router';

import resourceApi, {
  CreateResourceRelationProperty,
  ResourceDetailProperty,
  ServiceInventoryProperty,
} from '../../api/resource';
import { ContentWrapper, DeferRender } from '../../components';
import { compactDetails } from '../../redux/api/error';
import { enqueue } from '../../redux/snackbar';
import { Header } from './header';
import ResourceHistoryPage from './history';
import { AddRelationForm, AppRelationFormState } from './relations/create';
import ResourceRelationPage from './relations/view';
import { ResourceDetail } from './view';

const ResourceMainPage: React.FC = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const { search } = useLocation();
  const isReadOnly = new URLSearchParams(search).get('isReadOnly') === 'true';

  const resourceLoader = React.useMemo(async () => {
    if (!id) throw Error('No Resource ID specified.');

    return resourceApi(dispatch).get(id);
  }, [dispatch, id]);

  return (
    <DeferRender
      promise={resourceLoader}
      render={(resource) => <ResourceMain resource={resource} isReadOnly={isReadOnly} />}
    />
  );
};

interface ResourceMainProps {
  resource: ResourceDetailProperty;
  isReadOnly: boolean;
}

const ResourceMain: React.FC<ResourceMainProps> = (props) => {
  const { path } = useRouteMatch()!;
  const dispatch = useDispatch();
  const history = useHistory();
  const [serviceInventoryList, setServiceInventoryList] = React.useState<ServiceInventoryProperty[]>([]);
  const resourceId = props.resource.id.toString();

  React.useEffect(() => {
    resourceApi(dispatch)
      .listServiceInventory()
      .then((response) => setServiceInventoryList(response.results));
  }, [dispatch]);

  const createResourceRelation = async (data: AppRelationFormState, meta: FormikHelpers<AppRelationFormState>) => {
    try {
      const requestData: CreateResourceRelationProperty = {
        ...data,
        serviceInventory: data.serviceInventory ? data.serviceInventory.id : 0,
      };
      await resourceApi(dispatch).createAppRelation(requestData);
      dispatch(enqueue('Add relation successfully.', 'success'));
      history.push(`/resources/${resourceId}/relation`);
    } catch (err) {
      if ('details' in err) {
        meta.setErrors(compactDetails(err.details));
      }
      dispatch(enqueue(err.message || 'Error on submitting.', 'danger'));
    } finally {
      meta.setSubmitting(false);
    }
  };

  return (
    <>
      <Header resource={props.resource} isReadOnly={props.isReadOnly} />
      <ContentWrapper>
        <Switch>
          <Route exact path={`${path}/spec`} render={() => <ResourceDetail {...props} />} />
          <Route
            exact
            path={`${path}/history`}
            render={() => <ResourceHistoryPage resourceId={resourceId} isReadOnly={props.isReadOnly} />}
          />
          <Route
            exact
            path={`${path}/relation`}
            render={() => <ResourceRelationPage resourceId={resourceId} isReadOnly={props.isReadOnly} />}
          />
          <Route
            exact
            path={`${path}/relation/add-inbound`}
            render={() => (
              <AddRelationForm
                resourceId={resourceId}
                relation="inbound"
                serviceInventoryList={serviceInventoryList}
                onSubmit={createResourceRelation}
              />
            )}
          />
          <Route
            exact
            path={`${path}/relation/add-outbound`}
            render={() => (
              <AddRelationForm
                resourceId={resourceId}
                relation="outbound"
                serviceInventoryList={serviceInventoryList}
                onSubmit={createResourceRelation}
              />
            )}
          />
          <Redirect to={`${path}/spec`} />
        </Switch>
      </ContentWrapper>
    </>
  );
};

export default ResourceMainPage;
