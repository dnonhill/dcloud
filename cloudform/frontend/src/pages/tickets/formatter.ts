export const STATUS_TEXT_MAP: { [key: string]: string } = {
  created: 'New',
  approved: 'Approved',
  rejected: 'Rejected',
  assigned: 'In progress',
  dispatched: 'Dispatched',
  completed: 'Completed',
  commented: 'Commented',
  reviewed: 'Reviewed',
  feedback_applied: 'Feedback Applied',
};

export const STATUS_COLOR_MAP: { [key: string]: string } = {
  created: 'success is-light',
  approved: 'warning',
  rejected: 'danger',
  assigned: 'primary',
  dispatched: 'info',
  completed: 'success',
  commented: 'light',
  reviewed: 'dark',
  feedback_applied: 'white-ter',
};
