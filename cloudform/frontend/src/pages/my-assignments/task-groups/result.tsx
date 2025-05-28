import { Title } from 'bloomer';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useRouteMatch } from 'react-router';

import formConfigApi, { FormConfigSet } from '../../../api/form-config';
import taskGroupApi, { TaskGroupResponse } from '../../../api/task-group';
import { DeferRender } from '../../../components';
import { enqueue } from '../../../redux/snackbar';
import { RESOURCE_TYPE_VM } from '../../../resource-type';
import ResultForm from './result-form';

interface TaskGroupResultPageProps {
  taskGroup: TaskGroupResponse;
}

const TaskGroupResultPage: React.FC<TaskGroupResultPageProps> = (props) => {
  const { taskGroup } = props;
  const dispatch = useDispatch();
  const id = taskGroup.id;

  const history = useHistory();
  const parentMatch = useRouteMatch('/my-assignments/:assignmentId');

  const markCompleted = React.useCallback(
    (result) => {
      taskGroupApi(dispatch)
        .markComplete(id, result)
        .then(() => {
          if (!parentMatch) return;

          dispatch(enqueue('Resource is created or updated.', 'success'));
          history.push(parentMatch.url);
        })
        .catch(() => {
          dispatch(enqueue('Error while marking complete task.', 'error'));
        });
    },
    [dispatch, history, parentMatch, id],
  );

  const resultsCollector = React.useMemo(() => {
    return taskGroupApi(dispatch)
      .collectResults(id)
      .then((resp) => resp.results)
      .catch((err) => {
        console.error(err);
        return {};
      });
  }, [dispatch, id]);

  const formConfigLoader: Promise<FormConfigSet> = React.useMemo(async () => {
    if (taskGroup.ticketItem.resourceType !== RESOURCE_TYPE_VM) return {};

    return formConfigApi(dispatch).listByPage('vm-request-form');
  }, [dispatch, taskGroup]);

  if (!parentMatch) return null;

  return (
    <>
      <Title isSize={5}>Result of action</Title>
      <DeferRender
        promise={Promise.all([resultsCollector, formConfigLoader])}
        render={([initValues, formConfig]) => (
          <ResultForm
            taskGroup={taskGroup}
            onSubmit={markCompleted}
            formConfig={formConfig}
            initialValues={initValues}
          />
        )}
      />
    </>
  );
};

export default TaskGroupResultPage;
