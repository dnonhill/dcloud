export const TASK_MODE_VIEWER = 'viewer';
export const TASK_MODE_OPERATOR = 'operator';

export type ViewTaskMode = typeof TASK_MODE_OPERATOR | typeof TASK_MODE_VIEWER;
