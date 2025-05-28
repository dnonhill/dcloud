import { FormikHelpers } from 'formik';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';

import applicationApi, { ApplicationRequest } from '../../api/application';
import { AppHeader, AppSubTitle, AppTitle, ContentWrapper, ErrorBox } from '../../components';
import { compactDetails } from '../../redux/api/error';
import { enqueue } from '../../redux/snackbar';
import ApplicationForm from './form';

const NewApplication: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  const { projectId: projectIdParam } = useParams();
  const projectId = projectIdParam ? parseInt(projectIdParam) : 0;

  const [error, setError] = React.useState<string>();

  const createApplication = React.useCallback(
    async (app: ApplicationRequest, actions: FormikHelpers<ApplicationRequest>) => {
      try {
        const result = await applicationApi(dispatch).create(projectId, app);
        dispatch(enqueue('Create application successfully.', 'success'));
        history.push(`/applications/${result.id}/info`);
      } catch (err) {
        setError(err.message);
        dispatch(enqueue(err.message, 'danger'));
        if ('details' in err) {
          actions.setErrors(compactDetails(err.details));
        }
      } finally {
        actions.setSubmitting(false);
      }
    },
    [projectId, dispatch, history],
  );

  return (
    <>
      <AppHeader>
        <AppTitle>New Application</AppTitle>
        <AppSubTitle>
          Create your application to logical separate your project into manageable unit and create resources under it.
        </AppSubTitle>
      </AppHeader>
      <ContentWrapper>
        <ErrorBox>{error}</ErrorBox>
        <ApplicationForm projectId={projectId} mode="create" onSubmit={createApplication} />
      </ContentWrapper>
    </>
  );
};

export default NewApplication;
