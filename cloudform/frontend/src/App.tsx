import { Container, Hero, HeroHeader } from 'bloomer';
import React, { ComponentType } from 'react';
import { connect, Provider } from 'react-redux';
import { BrowserRouter as Router, Redirect, Route, Switch, useLocation } from 'react-router-dom';

import AppMenuContainer from './components/app-menu';
import SnackbarContainer from './components/snackbar';
import { ApplicationRoutes } from './pages/applications/route';
import ApprovementRoutes from './pages/approvements/route';
import AssignmentRoutes from './pages/assignments/route';
import BillingRoutes from './pages/billing';
import HomePage from './pages/home/home';
import AnonymousRoute from './pages/logins/route';
import MyAssignmentRoute from './pages/my-assignments/route';
import PriceCalculatorRoutes from './pages/price-calculator/routes';
import ProjectRoutes from './pages/projects/routes';
import ResourceRoutes from './pages/resources/routes';
import ReviewRoutes from './pages/reviews/route';
import { SearchCenter } from './pages/search/main';
import TicketRoutes from './pages/tickets/route';
import ProfilePage from './pages/users/profiles';
import { ApplicationState } from './redux/state';
import { configureStore } from './redux/store';
import { wsConnect } from './redux/websocket/creator';

const store = configureStore();
// Open websocket communication
store.dispatch(wsConnect());

const withStore = (HOC: ComponentType) => {
  return () => (
    <Provider store={store}>
      <HOC></HOC>
    </Provider>
  );
};

type StateToProps = {
  authorized: boolean;
};

type AppProps = StateToProps;

const mapStateToProps = (state: ApplicationState): StateToProps => ({
  authorized: !!(state.auth && state.auth.username),
});

const RedirectToLogin: React.FC = () => {
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  let extraParam = '';
  if (queryParams.get('username')) {
    extraParam = `&domain=${queryParams.get('domain')}&username=${queryParams.get('username')}`;
  }

  return <Redirect to={`/login?ref=${location.pathname}${extraParam}`} />;
};

const App: React.FC<AppProps> = ({ authorized }) => {
  return (
    <Router>
      <SnackbarContainer />
      <Hero isColor="dark">
        <HeroHeader>
          <Container>
            <AppMenuContainer />
          </Container>
        </HeroHeader>
      </Hero>
      <Switch>
        <Route path="/login" component={AnonymousRoute} />
        <Route path="/price-calculator" component={PriceCalculatorRoutes} />

        {!authorized ? <RedirectToLogin /> : null}
        <Route exact path="/" component={HomePage} />

        <Route path="/search" component={SearchCenter} />
        <Route path="/projects" component={ProjectRoutes} />
        <Route path="/applications/:id" component={ApplicationRoutes} />
        <Route path="/tickets/:id" component={TicketRoutes} />
        <Route path="/resources/:id" component={ResourceRoutes} />
        <Route path="/approvements" component={ApprovementRoutes} />
        <Route path="/assignments" component={AssignmentRoutes} />
        <Route path="/my-assignments" component={MyAssignmentRoute} />
        <Route path="/reviews" component={ReviewRoutes} />
        <Route path="/billing" component={BillingRoutes} />

        <Route path="/users/profile" component={ProfilePage} />
      </Switch>
    </Router>
  );
};

// const clearCsrfToken = () => {
//   const setCookie = (cname: string, cvalue: string, exdays: number): void => {
//     var d = new Date();
//     d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
//     var expires = 'expires=' + d.toUTCString();
//     document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
//   };

//   setCookie('csrftoken', '', 0);
// };

export default withStore(connect(mapStateToProps)(App));
