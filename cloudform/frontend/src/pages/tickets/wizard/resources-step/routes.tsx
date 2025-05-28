import * as React from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router';

import EditItemPage from './edit-item';
import MainResourcesStepPage from './main-page';
import NewItemPage from './new-item';
import { PreloadFormConfig } from './preload-form-config';
import UpdateResourcePage from './update-resource';

const ResourcesStep: React.FC<{ onNext: () => void }> = (props) => {
  const { path, url } = useRouteMatch()!;

  return (
    <PreloadFormConfig>
      <Switch>
        <Route exact path={path} render={() => <MainResourcesStepPage onNext={props.onNext} />} />
        <Route
          exact
          path={`${path}/new-update/:resourceId`}
          render={() => <UpdateResourcePage successUrl={`${url}`} />}
        />
        <Route exact path={`${path}/:index/edit`} render={() => <EditItemPage successUrl={`${url}`} />} />
        <Route exact path={`${path}/new`} render={() => <NewItemPage successUrl={`${url}`} />} />
        <Redirect to={path} />
      </Switch>
    </PreloadFormConfig>
  );
};

export default ResourcesStep;
