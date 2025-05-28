import React, { useState } from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { TicketItemRequestWithPseudoId } from '../../api/ticket';
import { AppHeader, AppTitle, ContentWrapper } from '../../components';
import { PreloadFormConfig } from '../tickets/wizard/resources-step/preload-form-config';
import PriceCalculator from '.';
import EditItemPage from './edit-item';
import NewItemPage from './new-item';

const PriceCalculatorRoutes: React.FC = () => {
  const { path, url } = useRouteMatch()!;

  const [resourceItems, setResourceItems] = useState<TicketItemRequestWithPseudoId[]>([]);

  return (
    <>
      <AppHeader>
        <AppTitle>Price calculator</AppTitle>
      </AppHeader>
      <ContentWrapper>
        <PreloadFormConfig>
          <Switch>
            <Route
              exact
              path={`${path}`}
              render={() => <PriceCalculator items={resourceItems} setItems={setResourceItems} />}
            />
            <Route
              exact
              path={`${path}/:index/edit`}
              render={() => <EditItemPage successUrl={`${url}`} items={resourceItems} setItems={setResourceItems} />}
            />
            <Route
              exact
              path={`${path}/new`}
              render={() => <NewItemPage successUrl={`${url}`} items={resourceItems} setItems={setResourceItems} />}
            />
            <Redirect to={`${path}`} />
          </Switch>
        </PreloadFormConfig>
      </ContentWrapper>
    </>
  );
};

export default PriceCalculatorRoutes;
