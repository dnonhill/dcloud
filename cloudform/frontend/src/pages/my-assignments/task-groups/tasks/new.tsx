import { Button, Control, Field, Icon, Input } from 'bloomer';
import * as React from 'react';
import { useContext } from 'react';
import { useDispatch } from 'react-redux';

import { taskApi } from '../../../../api/task';
import { enqueue } from '../../../../redux/snackbar';
import { addTask, TaskDispatcherContext } from './state';
import { useComponentMounted } from './util';

interface AddTaskProps {
  onSubmit: (description: string) => void;
  isSubmitting: boolean;
}

const AddTaskForm: React.FC<AddTaskProps> = (props) => {
  const [description, setDescription] = React.useState('');

  const onAddTask = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!description || props.isSubmitting) return;

    props.onSubmit(description);
  };

  const onInputChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setDescription(e.currentTarget.value);
  };

  return (
    <form onSubmit={onAddTask}>
      <Field hasAddons>
        <Control isExpanded>
          <Input name="taskDescription" placeholder="Task information" onChange={onInputChange} />
        </Control>
        <Control>
          <Button type="submit" data-action="submit-add-task" isColor="primary" isLoading={props.isSubmitting}>
            <Icon className="fas fa-pen" />
            <span>Add task</span>
          </Button>
        </Control>
      </Field>
    </form>
  );
};

interface AddTaskButtonProps {
  onAddTask: () => void;
}
const AddTaskButton: React.FC<AddTaskButtonProps> = (props) => (
  <Button data-action="add-task" isSize="small" isColor="primary" onClick={() => props.onAddTask()}>
    <Icon className="fas fa-pen" />
    <span>Add task</span>
  </Button>
);

interface AddTaskPanel {
  groupId: string | number;
}

const AddTaskPanel: React.FC<AddTaskPanel> = (props) => {
  const [state, setState] = React.useState({
    editMode: false,
    loading: false,
  });

  const dispatch = useDispatch();
  const didMounted = useComponentMounted();
  const dispatchTasks = useContext(TaskDispatcherContext);

  const onTaskSubmit = async (description: string) => {
    try {
      setState({
        ...state,
        loading: true,
      });
      const resp = await taskApi(dispatch).newTask(props.groupId, { description: description });
      if (didMounted.current) {
        dispatchTasks(addTask(resp));
        setState({
          loading: false,
          editMode: false,
        });
      }
    } catch (e) {
      console.error(e);
      if (didMounted.current) {
        dispatch(enqueue('Failed to add task, please try again.', 'error'));
        setState({
          ...state,
          loading: false,
        });
      }
    }
  };

  const openEditMode = () => {
    setState({
      ...state,
      editMode: true,
    });
  };

  if (state.editMode) {
    return <AddTaskForm onSubmit={onTaskSubmit} isSubmitting={state.loading} />;
  } else {
    return <AddTaskButton onAddTask={openEditMode} />;
  }
};

export default AddTaskPanel;
