import * as React from 'react';
import { useDispatch } from 'react-redux';
import { Link, Route, Switch, useParams, useRouteMatch } from 'react-router-dom';

import { TaskGroupResponse } from '../../../api/task-group';
import taskGroupApi from '../../../api/task-group';
import { AppHeader, AppSubTitle, AppTitle, ContentWrapper, DeferRender } from '../../../components';
import { useUserProfile } from '../../../redux/auth';
import { TicketItemHeader } from '../../tickets/detail';
import TaskGroupInfo from './info';
import { TASK_MODE_OPERATOR, TASK_MODE_VIEWER } from './mode';
import TaskGroupResultPage from './result';

interface TaskGroupHeaderProps {
  taskGroup: TaskGroupResponse;
  assignmentId: string;
}
const TaskGroupHeader: React.FC<TaskGroupHeaderProps> = ({ taskGroup, assignmentId }) => (
  <AppHeader>
    <AppTitle>
      <TicketItemHeader ticketItem={taskGroup.ticketItem} isPlainText={true} />
    </AppTitle>
    <AppSubTitle>
      <span className="is-family-secondary">TICKET</span>&nbsp;
      <Link to={`/my-assignments/${assignmentId}`} className="has-text-info">
        {taskGroup.ticket.ticketNo}
      </Link>
    </AppSubTitle>
  </AppHeader>
);

interface ViewTaskGroupProps {
  taskGroup: TaskGroupResponse;
}

const PageLayout: React.FC<ViewTaskGroupProps> = ({ taskGroup }) => {
  const user = useUserProfile();
  const canManageTask = user && user.id === taskGroup.assignee;
  const mode = canManageTask ? TASK_MODE_OPERATOR : TASK_MODE_VIEWER;

  const match = useRouteMatch()!;
  const { path } = match;

  return (
    <>
      <TaskGroupHeader taskGroup={taskGroup} assignmentId={(match.params as any).assignmentId || ''} />
      <ContentWrapper>
        <Switch>
          {canManageTask && (
            <Route path={`${path}/result`} render={() => <TaskGroupResultPage taskGroup={taskGroup} />} />
          )}
          <Route render={() => <TaskGroupInfo taskGroup={taskGroup} mode={mode} />} />
        </Switch>
      </ContentWrapper>
    </>
  );
};

const TaskGroupRoutes: React.FC = () => {
  const dispatch = useDispatch();
  const { id: taskGroupId } = useParams();

  const taskGroupLoader = React.useMemo(async () => {
    if (!taskGroupId) throw new Error('No TaskGroup id given.');
    const taskGroup = await taskGroupApi(dispatch).get(taskGroupId);
    return {
      taskGroup,
    };
  }, [dispatch, taskGroupId]);

  return <DeferRender promise={taskGroupLoader} render={({ taskGroup }) => <PageLayout taskGroup={taskGroup} />} />;
};

export default TaskGroupRoutes;
