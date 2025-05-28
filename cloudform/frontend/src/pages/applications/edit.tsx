import { FormikHelpers } from 'formik';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import applicationApi, { ApplicationRequest, ApplicationResponse } from '../../api/application';
import { AppHeader, AppSubTitle, AppTitle, ContentWrapper, ErrorBox } from '../../components';
import { compactDetails } from '../../redux/api/error';
import { enqueue } from '../../redux/snackbar';
import ApplicationContext from './context';
import ApplicationForm from './form';

const EditApplication: React.FC<{ application: ApplicationResponse }> = (props) => {
  const { application } = props;
  const dispatch = useDispatch();
  const history = useHistory();

  const [error, setError] = React.useState<string>();

  const updateApplication = React.useCallback(
    async (newValues: ApplicationRequest, actions: FormikHelpers<ApplicationRequest>) => {
      const api = applicationApi(dispatch);
      try {
        await api.update(application.id, newValues);
        dispatch(enqueue('Update application successfully.', 'success'));
        history.push('info?reload=true');
      } catch (err) {
        dispatch(enqueue(err.message, 'danger'));
        setError(err.message);
        actions.setErrors(compactDetails(err.details));
      } finally {
        actions.setSubmitting(false);
      }
    },
    [dispatch, history, application.id],
  );

  const initialApp = React.useMemo<ApplicationRequest>(() => {
    return {
      id: application.id,
      name: application.name,
      description: application.description,
      project: application.project.id,
      supporterName: application.supporterName,
      supporterEmail: application.supporterEmail,
      supporterDepartment: application.supporterDepartment,
      supporterOrganization: application.supporterOrganization,
      systemDiagram: null,
    };
  }, [application]);

  return (
    <>
      <AppHeader>
        <AppTitle>Edit Application</AppTitle>
        <AppSubTitle>
          Edit your application to logical separate your project into manageable unit and create resources under it.
        </AppSubTitle>
      </AppHeader>
      <ContentWrapper>
        <ErrorBox>{error}</ErrorBox>
        <ApplicationForm application={initialApp} mode="edit" onSubmit={updateApplication} />
      </ContentWrapper>
    </>
  );
};

const EditApplicationPage: React.FC = () => {
  const application = React.useContext(ApplicationContext);
  return <EditApplication application={application} />;
};

export default EditApplicationPage;
export { EditApplication };
