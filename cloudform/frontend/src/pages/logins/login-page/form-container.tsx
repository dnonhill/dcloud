import { Icon, Title } from 'bloomer';
import { FormikHelpers } from 'formik';
import * as React from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import * as Router from 'react-router';
import { Link } from 'react-router-dom';
import { Dispatch } from 'redux';

import ErrorBox from '../../../components/error-box';
import config from '../../../config';
import { AuthenticationState } from '../../../redux/auth';
import { login as loginAction } from '../../../redux/auth/creator';
import { ApplicationState } from '../../../redux/state';
import { LoginProperties, UserType } from './model';
import NonPttLoginForm from './non-ptt-form';
import PttLoginForm from './ptt-form';

const login = (dispatch: Dispatch) => (username: string, password: string, domain: string | undefined) => {
  dispatch(
    loginAction({
      domain,
      username,
      password,
    }),
  );
};

const handleSubmit = (dispatch: Dispatch) => (values: LoginProperties, actions: FormikHelpers<LoginProperties>) => {
  const { domain, username, password } = values;
  login(dispatch)(username, password, domain);
  actions.setSubmitting(false); // TODO Defer until the result of login settlement
};

const LoginFormContainer: React.FC<{ userType: UserType }> = (props) => {
  const auth = useSelector<ApplicationState, AuthenticationState>((state) => state.auth, shallowEqual);
  const history = Router.useHistory();

  const rawQueryString = Router.useLocation().search;
  const queryString = new URLSearchParams(rawQueryString);

  if (!auth.isAuthenticating && auth.username && auth.profile) {
    let nextPage = queryString.get('ref') || '/';
    history.push(nextPage);
  }

  const dispatch = useDispatch();
  const onSubmit = React.useCallback(handleSubmit(dispatch), [dispatch]);

  const errorMessage = !auth.isAuthenticating ? auth.error : null;

  const initialValues = {
    domain: props.userType === 'ptt' ? queryString.get('domain') || 'pttdigital' : undefined,
    username: queryString.get('username') || '',
    password: '',
  };

  return (
    <>
      <Title>Sign in to DCloud</Title>
      <ErrorBox>{errorMessage}</ErrorBox>
      {props.userType === 'ptt' ? (
        <PttLoginForm
          onSubmit={onSubmit}
          initialValues={initialValues}
          nonPttUserLink={`/login/non-ptt${rawQueryString}`}
        />
      ) : (
        <>
          <NonPttLoginForm onSubmit={onSubmit} initialValues={initialValues} />
          <p className="has-text-right help">
            <Link to={`/login/ptt${rawQueryString}`}>I'm PTT user.</Link>
          </p>
        </>
      )}
      <p>
        <a className="is-size-6" href={config.DOC_HOST} target="_blank" rel="noopener noreferrer">
          <Icon className="far fa-question-circle" />
          <span>Help center</span>
        </a>
      </p>
    </>
  );
};

export default LoginFormContainer;
