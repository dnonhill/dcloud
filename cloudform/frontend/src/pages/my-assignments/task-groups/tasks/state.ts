import * as React from 'react';

import { ScriptTask, Task, TASK_TYPE_SCRIPT } from '../../../../api/task';

export const INITIAL_TASKS = 'initial_tasks';
export const ADD_TASK = 'add_task';
export const UPDATE_TASK = 'update_task';
export const COMPLETE_RUN_SCRIPT = 'complete_run_script';

interface InitialTasksAction {
  type: typeof INITIAL_TASKS;
  tasks: Task[];
}

interface AddTaskAction {
  type: typeof ADD_TASK;
  task: Task;
}

interface UpdateTaskAction {
  type: typeof UPDATE_TASK;
  task: Task;
}

interface CompleteRunScript {
  type: typeof COMPLETE_RUN_SCRIPT;
  task: ScriptTask;
}

type TaskAction = InitialTasksAction | AddTaskAction | UpdateTaskAction | CompleteRunScript;

export function initialTasks(tasks: Task[]): TaskAction {
  return {
    type: INITIAL_TASKS,
    tasks: tasks,
  };
}

export function addTask(task: Task): TaskAction {
  return {
    type: ADD_TASK,
    task: task,
  };
}

export function updateTask(task: Task): TaskAction {
  return {
    type: UPDATE_TASK,
    task: task,
  };
}

export function completeRunScript(task: ScriptTask): TaskAction {
  return {
    type: COMPLETE_RUN_SCRIPT,
    task: task,
  };
}

export function reduceTasks(state: Task[], action: TaskAction): Task[] {
  switch (action.type) {
    case INITIAL_TASKS:
      return [...state, ...action.tasks];
    case ADD_TASK:
      return [...state, action.task];
    case UPDATE_TASK:
      return state.map((task) => (task.id === action.task.id ? action.task : task));
    case COMPLETE_RUN_SCRIPT:
      return state.map((task) => {
        if (task.id === action.task.id && task.taskType === TASK_TYPE_SCRIPT)
          return {
            ...task,
            finishTime: action.task.finishTime!,
            isSuccess: action.task.isSuccess!,
            jobUrl: action.task.jobUrl,
          };
        return task;
      });
    default:
      return state;
  }
}

export const TaskDispatcherContext = React.createContext<React.Dispatch<TaskAction>>((_: TaskAction) => {});
