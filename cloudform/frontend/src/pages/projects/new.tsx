import { FormikHelpers } from 'formik';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import jobCodeApi from '../../api/job-code';
import projectApi, { ProjectRequest } from '../../api/project';
import { AppHeader, AppSubTitle, AppTitle, ContentWrapper } from '../../components';
import ErrorBox from '../../components/error-box';
import { compactDetails } from '../../redux/api/error';
import { enqueue } from '../../redux/snackbar';
import ProjectForm from './form';
import JobCodeModal from './modal';

const NewProject: React.FC = () => {
  const history = useHistory();
  const dispatch = useDispatch();

  const [error, setError] = React.useState<string>();
  const [modalIsOpen, setIsOpen] = React.useState<boolean>(false);
  const [projectRequest, setProjectRequest] = React.useState<ProjectRequest | undefined>(undefined);
  const [formikProject, setFormikProject] = React.useState<FormikHelpers<ProjectRequest>>();

  const onSubmit = React.useCallback(
    async (values: ProjectRequest, meta: FormikHelpers<ProjectRequest>) => {
      jobCodeApi(dispatch)
        .get(values.jobCode)
        .then(() => {
          setProjectRequest(values);
          setFormikProject(meta);
          setIsOpen(true);
        })
        .catch((err) => {
          dispatch(enqueue(err.details, 'danger'));
        });
    },
    [dispatch],
  );

  const onConfirm = async (values: ProjectRequest, meta: FormikHelpers<ProjectRequest>) => {
    try {
      const { id } = await projectApi(dispatch).create(values);
      dispatch(enqueue('Create project successfully.', 'success'));
      history.push(id.toString());
    } catch (err) {
      setError(err.message);
      if ('details' in err) {
        meta.setErrors(compactDetails(err.details));
      }
    } finally {
      meta.setSubmitting(false);
    }
  };
  const onCancel = () => {
    setIsOpen(false);
  };
  return (
    <>
      {projectRequest && formikProject && (
        <JobCodeModal
          jobCodeNo={projectRequest.jobCode}
          meta={formikProject}
          onConfirm={onConfirm}
          onCancel={onCancel}
          projectRequest={projectRequest}
          modalIsOpen={modalIsOpen}
        />
      )}
      <AppHeader>
        <AppTitle>New Project</AppTitle>
        <AppSubTitle>Create your project for manage applications and resources.</AppSubTitle>
      </AppHeader>
      <ContentWrapper>
        {error && <ErrorBox>{error}</ErrorBox>}
        <ProjectForm onSubmit={onSubmit} />
      </ContentWrapper>
    </>
  );
};

export default NewProject;
