import { Icon, Media, MediaContent, MediaLeft } from 'bloomer';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import { Task, TASK_TYPE_MANUAL, TASK_TYPE_SCRIPT, taskApi } from '../../../../api/task';
import { useComponentMounted } from './util';

interface TodoTask {
  task: Task;
  state: 'completed' | 'incomplete' | 'loading';
  onToggle: () => void;
}

const checkboxIconMap = {
  completed: 'fas fa-check-square',
  incomplete: 'far fa-square',
  loading: 'fas fa-spinner fa-pulse',
};

const taskIconMap = {
  [TASK_TYPE_MANUAL]: 'fas fa-hand-paper',
  [TASK_TYPE_SCRIPT]: 'fas fa-cog',
};

const TodoTask: React.FC<TodoTask> = (props) => {
  const { task, state, onToggle } = props;
  const handleCheckboxClick = () => {
    if (state !== 'loading') onToggle();
  };

  return (
    <Media className="task" data-id={task.id}>
      <MediaLeft>
        <span className={state === 'completed' ? 'has-text-success' : ''}>
          <Icon className={checkboxIconMap[state]} data-field="completeState" data-value={state} onClick={onToggle} />
        </span>
      </MediaLeft>
      <MediaContent>
        <p style={{ cursor: 'hand' }} onClick={handleCheckboxClick}>
          <Icon className={taskIconMap[task.taskType]} />
          <strong>{task.description}</strong>
        </p>
        {props.children}
      </MediaContent>
    </Media>
  );
};

function useToggleCompletion(task: Task) {
  const dispatch = useDispatch();
  const [state, setState] = React.useState({
    complete: task.complete,
    loading: false,
  });

  const didMounted = useComponentMounted();
  const taskId = task.id;

  const toggleComplete = React.useCallback(async () => {
    console.log('Toggle complete', state);
    if (state.loading) return;

    setState({
      complete: state.complete,
      loading: true,
    });

    const api = taskApi(dispatch);
    const action = state.complete ? api.unmarkComplete : api.markComplete;
    action(taskId).then((resp) => {
      if (didMounted.current) {
        setState({
          complete: resp.complete,
          loading: false,
        });
      }
    });
  }, [dispatch, taskId, state, didMounted]);

  return {
    state: state,
    toggle: toggleComplete,
  };
}

interface TodoTaskContainerProps {
  task: Task;
  isEditable: boolean;
}
const TodoTaskContainer: React.FC<TodoTaskContainerProps> = (props) => {
  const completion = useToggleCompletion(props.task);
  const checkboxState = completion.state.loading ? 'loading' : completion.state.complete ? 'completed' : 'incomplete';

  return (
    <TodoTask task={props.task} state={checkboxState} onToggle={props.isEditable ? completion.toggle : () => {}}>
      {props.children}
    </TodoTask>
  );
};

export { TodoTaskContainer };
