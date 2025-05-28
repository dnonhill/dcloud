import { FormikHelpers } from 'formik';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';

import projectApi, { ProjectRequest } from '../../api/project';
import { AppHeader, AppTitle, ContentWrapper, DeferRender } from '../../components';
import ErrorBox from '../../components/error-box';
import { compactDetails } from '../../redux/api/error';
import { enqueue } from '../../redux/snackbar';
import ProjectForm from './form';

const EditProject: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const [error, setError] = React.useState<string | undefined>();
  const { projectId } = useParams();
  const id = projectId ? parseInt(projectId) : 0;

  const loader = React.useMemo(async () => {
    return await projectApi(dispatch).get(id);
  }, [id, dispatch]);

  const updateProject = React.useCallback(
    async (project: ProjectRequest, meta: FormikHelpers<ProjectRequest>) => {
      try {
        await projectApi(dispatch).update(id, project);
        dispatch(enqueue('Update project successfully.', 'success'));
        history.push(`/projects/${id}`);
      } catch (err) {
        setError(err.message);
        if ('details' in err) {
          meta.setErrors(compactDetails(err.details));
        }
      } finally {
        meta.setSubmitting(false);
      }
    },
    [id, dispatch, history],
  );

  return (
    <>
      <AppHeader>
        <AppTitle>Edit Project</AppTitle>
      </AppHeader>
      <ContentWrapper>
        {error && <ErrorBox>{error}</ErrorBox>}
        <DeferRender
          promise={loader}
          render={(project) => <ProjectForm initialValues={project} onSubmit={updateProject} />}
        />
      </ContentWrapper>
    </>
  );
};

export default EditProject;
