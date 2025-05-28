import React from 'react';
import { CookiesProvider } from 'react-cookie';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router';

import { AppHeader, AppTitle, ContentWrapper } from '../../components';
import { SearchApplication } from './application';
import { SearchProject } from './project';
import { SearchResource } from './resource';
import { SearchResourceRelation } from './resource-relation';
import { SearchTicket } from './ticket';
import TicketRouter from './ticket-router';

export const MENU = {
  Project: 'projects',
  Application: 'applications',
  Ticket: 'tickets',
  Resource: 'resources',
  'App Relation': 'resources-relation',
};

export const SearchCenter: React.FC = () => {
  const { path } = useRouteMatch()!;
  return (
    <CookiesProvider>
      <AppHeader subMenu={MENU}>
        <AppTitle>Search Center</AppTitle>
      </AppHeader>
      <ContentWrapper>
        <Switch>
          <Route path={`${path}/projects`} component={SearchProject} />
          <Route path={`${path}/applications`} component={SearchApplication} />
          <Route path={`${path}/tickets/:ticketId/redirect`} component={TicketRouter} />
          <Route exact path={`${path}/tickets`} component={SearchTicket} />
          <Route path={`${path}/resources-relation`} component={SearchResourceRelation} />
          <Route path={`${path}/resources`} component={SearchResource} />
          <Redirect to={`${path}/tickets`} />
        </Switch>
      </ContentWrapper>
    </CookiesProvider>
  );
};
