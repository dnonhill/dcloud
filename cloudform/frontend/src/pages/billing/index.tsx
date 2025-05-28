import React from 'react';
import { CookiesProvider } from 'react-cookie';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router';

import { AppHeader, AppTitle, ContentWrapper } from '../../components';
import AllPricePerDay from './all-price-per-day';
import BillingDetail from './billing-detail';
import DownloadInvoice from './download-invoice';
import Uptime from './uptime';

export const MENU = {
  Summary: 'summary',
  Detail: 'detail',
  Uptime: 'uptime',
  Invoice: 'invoice',
};

const Billing: React.FC = () => {
  const { path } = useRouteMatch()!;
  return (
    <CookiesProvider>
      <AppHeader subMenu={MENU}>
        <AppTitle>Billing</AppTitle>
      </AppHeader>
      <ContentWrapper>
        <Switch>
          <Route path={`${path}/summary`} component={AllPricePerDay} />
          <Route path={`${path}/detail`} component={BillingDetail} />
          <Route path={`${path}/uptime`} component={Uptime} />
          <Route path={`${path}/invoice`} component={DownloadInvoice} />
          <Redirect to={`${path}/summary`} />
        </Switch>
      </ContentWrapper>
    </CookiesProvider>
  );
};

export default Billing;
