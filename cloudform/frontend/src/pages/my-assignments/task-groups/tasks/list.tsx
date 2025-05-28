import { Title } from 'bloomer';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { Dispatch } from 'redux';

import { ScriptTask, Task, TASK_TYPE_SCRIPT, taskApi, taskSubscriptionApi } from '../../../../api/task';
import { TaskGroupResponse } from '../../../../api/task-group';
import { TASK_MODE_OPERATOR, ViewTaskMode } from '../mode';
import { TodoTaskContainer } from './item';
import AddTaskPanel from './new';
import ScriptPanel from './script';
import { completeRunScript, initialTasks, reduceTasks, TaskDispatcherContext } from './state';

interface TaskSectionProps {
  taskGroup: TaskGroupResponse;
  mode: ViewTaskMode;
}

function loadTasks(dispatch: Dispatch, taskGroupId: number) {
  return taskApi(dispatch).listByTaskGroup(taskGroupId);
}

export const TaskSection: React.FC<TaskSectionProps> = ({ taskGroup, mode }) => {
  const [tasks, dispatchTasks] = React.useReducer(reduceTasks, []);
  const dispatchRedux = useDispatch();

  // Data loading section
  React.useEffect(() => {
    loadTasks(dispatchRedux, taskGroup.id).then((_tasks) => dispatchTasks(initialTasks(_tasks)));
  }, [dispatchRedux, taskGroup]);

  React.useEffect(() => {
    return taskSubscriptionApi(dispatchRedux).taskComplete((task_: Task) => {
      dispatchTasks(completeRunScript(task_ as ScriptTask));
    });
  }, [dispatchRedux, taskGroup]);

  const isEditable = mode === TASK_MODE_OPERATOR && !taskGroup.complete;

  return (
    <TaskDispatcherContext.Provider value={dispatchTasks}>
      <section className="task-section">
        <Title isSize={5}>To-Dos</Title>
        {tasks.map((task) => (
          <TodoTaskContainer task={task} isEditable={isEditable} key={task.id}>
            {task.taskType === TASK_TYPE_SCRIPT && <ScriptPanel task={task as ScriptTask} isEditable={isEditable} />}
          </TodoTaskContainer>
        ))}
        <br />
        {isEditable && <AddTaskPanel groupId={taskGroup.id} />}
      </section>
    </TaskDispatcherContext.Provider>
  );
};
