import { Button, Column, Columns, Icon, Subtitle, Title } from 'bloomer';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useLocation, useRouteMatch } from 'react-router';

import taskGroupApi, { TaskGroupResponse } from '../../../api/task-group';
import { ReactComponent as Done } from '../../../asset/done.svg';
import {
  DataField,
  IllustratedMessage,
  IllustratedMessageContent,
  IllustratedMessageIllustration,
} from '../../../components';
import { RESOURCE_TYPE_OTHER } from '../../../resource-type';
import JobCodeModal from '../../projects/modal';
import { SpecificationContent } from '../../tickets/resource-spec';
import { TASK_MODE_OPERATOR, ViewTaskMode } from './mode';
import { TaskSection } from './tasks';

interface TaskGroupInfoProps {
  taskGroup: TaskGroupResponse;
  onMarkComplete: () => Promise<any>;
  mode: ViewTaskMode;
}

const TaskGroupInfo: React.FC<TaskGroupInfoProps> = ({ taskGroup, onMarkComplete, mode }) => {
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [modalIsOpen, setModalIsOpen] = React.useState<boolean>(false);
  const onMarkCompleteClick = () => {
    setSubmitting(true);
    onMarkComplete().catch(() => setSubmitting(false));
  };

  const openJobCodeModal = (): void => {
    setModalIsOpen(true);
  };

  const onClose = (): void => {
    setModalIsOpen(false);
  };

  return (
    <>
      <JobCodeModal
        modalIsOpen={modalIsOpen}
        onConfirm={onClose}
        onCancel={onClose}
        jobCodeNo={taskGroup.ticket.jobCode}
        modalTitle="Job Code Detail"
        modalCancelText="Close"
      />
      {!taskGroup.complete && mode === TASK_MODE_OPERATOR && (
        <div className="has-text-right">
          <Button
            data-action="markComplete"
            isColor="info"
            className="is-rounded"
            isLoading={isSubmitting}
            onClick={onMarkCompleteClick}
          >
            <Icon className="far fa-check-circle" />
            <span>Mark complete</span>
          </Button>
        </div>
      )}
      {taskGroup.complete && (
        <IllustratedMessage>
          <IllustratedMessageIllustration>
            <Done />
          </IllustratedMessageIllustration>
          <IllustratedMessageContent>
            <Title className="has-text-success">Task has been accomplish!</Title>
            <Subtitle className="has-text-success">Thank you for your cooperation.</Subtitle>
          </IllustratedMessageContent>
        </IllustratedMessage>
      )}
      <Columns>
        <Column>
          <Title isSize={5}>Specifications</Title>
          <DataField label="Data center">
            <span data-field="data-center">{taskGroup.ticket.dataCenter ? taskGroup.ticket.dataCenter.name : ''}</span>
          </DataField>
          <DataField label="Job code">
            <span data-field="job-code" onClick={openJobCodeModal} className="has-text-primary is-clickable">
              {taskGroup.ticket.jobCode}
            </span>
          </DataField>
          <SpecificationContent ticketItem={taskGroup.ticketItem} />
        </Column>
        <Column>
          <TaskSection taskGroup={taskGroup} mode={mode} />
        </Column>
      </Columns>
    </>
  );
};

interface TaskGroupInfoPageProps {
  taskGroup: TaskGroupResponse;
  mode: ViewTaskMode;
}

const TaskGroupInfoPage: React.FC<TaskGroupInfoPageProps> = ({ taskGroup, mode }) => {
  const history = useHistory();
  const location = useLocation();
  const parentMatch = useRouteMatch('/my-assignments/:assignmentId');

  const dispatch = useDispatch();

  let handleMarkComplete: () => Promise<any> = () => Promise.resolve();

  if (mode === TASK_MODE_OPERATOR) {
    handleMarkComplete = () => {
      history.push(`${location.pathname}/result`);
      return Promise.resolve();
    };

    if (taskGroup.ticketItem.action === 'delete' || taskGroup.ticketItem.resourceType === RESOURCE_TYPE_OTHER) {
      handleMarkComplete = () => {
        return taskGroupApi(dispatch)
          .markComplete(taskGroup.id, {})
          .then(() => history.push(parentMatch!.url));
      };
    }
  }

  return <TaskGroupInfo taskGroup={taskGroup} onMarkComplete={handleMarkComplete} mode={mode} />;
};

export default TaskGroupInfoPage;
export { TaskGroupInfo };
