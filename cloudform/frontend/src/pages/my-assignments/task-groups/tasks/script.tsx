/* eslint-disable simple-import-sort/sort */
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';

import {
  Button,
  Delete,
  Icon,
  ModalCard,
  ModalCardBody,
  ModalCardFooter,
  ModalCardHeader,
  ModalCardTitle,
} from 'bloomer';
import * as React from 'react';
import { useContext } from 'react';
import { useDispatch } from 'react-redux';

import { ScriptTask, taskApi } from '../../../../api/task';
import { Modal } from '../../../../components';
import { ErrorMessage } from '../../../../components/error-message';
import { displayDateTime } from '../../../../formatter/date';
import { enqueue } from '../../../../redux/snackbar';
import { addTask, TaskDispatcherContext } from './state';
import { useComponentMounted } from './util';

interface RunScriptProps {
  task: ScriptTask;
  loadInitVars: () => Promise<string>;
  onSubmit: (vars: string) => void;
}

const RunScript: React.FC<RunScriptProps> = (props) => {
  const [activeVarsInput, setActiveVarsInput] = React.useState(false);
  const closeVarsInput = () => setActiveVarsInput(false);

  const didMounted = useComponentMounted();
  const [vars, setVars] = React.useState('');
  const openVarsInput = async () => {
    const newVars = await props.loadInitVars();
    if (didMounted.current) {
      setVars(JSON.stringify(JSON.parse(newVars), null, 4));
      setActiveVarsInput(true);
    }
  };

  const handleVarsChange = (newVars: string) => {
    setVars(newVars);
  };

  const [error, setError] = React.useState<string | undefined>('');
  React.useEffect(() => {
    if (activeVarsInput) setError('');
  }, [activeVarsInput]);

  const onSubmit = () => {
    try {
      props.onSubmit(JSON.parse(vars));
      closeVarsInput();
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError('JSON format is incorrect.');
      } else {
        throw e;
      }
    }
  };

  return (
    <>
      <Button isSize="small" style={{ marginTop: '0.6rem' }} onClick={() => openVarsInput()}>
        <Icon className="fas fa-play" />
        <span>Run script</span>
      </Button>

      <Modal isActive={activeVarsInput}>
        <ModalCard>
          <ModalCardHeader>
            <ModalCardTitle>Parameter</ModalCardTitle>
            <Delete onClick={closeVarsInput} />
          </ModalCardHeader>
          <ModalCardBody>
            <ErrorMessage>{error}</ErrorMessage>
            <AceEditor
              name="vars"
              value={vars}
              onChange={handleVarsChange}
              mode="json"
              theme="github"
              setOptions={{ useWorker: false }}
            />
          </ModalCardBody>
          <ModalCardFooter>
            <Button isColor="primary" onClick={onSubmit} data-action="submit-parameter">
              Run script
            </Button>
          </ModalCardFooter>
        </ModalCard>
      </Modal>
    </>
  );
};

interface WithScriptTask {
  task: ScriptTask;
}
type RunScriptContainerProps = WithScriptTask & {
  onSubmitTriggered: (taskResponse: ScriptTask) => void;
};

const RunScriptContainer: React.FC<RunScriptContainerProps> = (props) => {
  const { task } = props;
  const dispatch = useDispatch();

  const onSubmit = async (vars: any) => {
    const resp = await taskApi(dispatch).runScript(task.id, vars);
    props.onSubmitTriggered(resp);
  };

  const loadExtraVars = async () => {
    return taskApi(dispatch)
      .extraVars(task.id)
      .then((resp) => JSON.stringify(resp));
  };

  return <RunScript task={task} loadInitVars={loadExtraVars} onSubmit={onSubmit} />;
};

const DuplicateTaskButton: React.FC<WithScriptTask> = (props) => {
  const dispatch = useDispatch();
  const dispatchTasks = useContext(TaskDispatcherContext);

  const handleClick = () => {
    taskApi(dispatch)
      .duplicate(props.task.id)
      .then((resp) => dispatchTasks(addTask(resp)))
      .catch(() => dispatch(enqueue('Failed to duplicate the task.', 'danger')));
  };

  return (
    <Button style={{ marginTop: 5 }} isSize="small" onClick={handleClick}>
      Duplicate task
    </Button>
  );
};

const TaskStatusButton: React.FC<any> = (props) => {
  const dispatch = useDispatch();

  const handleClick = () => {
    taskApi(dispatch).getStatus(props.task.id, props.task.acknowledgeId).then(() => window.location.reload())
  };

  return (
    <Button style={{ marginLeft: 10, marginTop: 5 }} isSize="small" onClick={handleClick}>
      Get task status
    </Button>
  );
};

type ScriptLabelProps = WithScriptTask & { isEditable: boolean };

const ScriptDone: React.FC<ScriptLabelProps> = (props) => {
  const { task } = props;
  return (
    <p className="is-size-7">
      Run at {task.finishTime && displayDateTime(task.finishTime)}
      &nbsp;-&nbsp;
      <span className={`has-text-${task.isSuccess ? 'success' : 'danger'}`}>
        {task.isSuccess ? 'success' : 'failed'}
      </span>
      &nbsp;
      {task.jobUrl && (
        <a
          href={task.jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="is-family-monospace"
          style={{ textDecoration: 'underline' }}
        >
          View ansible job
        </a>
      )}
      {props.isEditable && (
        <>
          <br />
          <DuplicateTaskButton task={task} />
        </>
      )}
    </p>
  );
};

const ScriptRunning: React.FC<ScriptLabelProps & { startTime: string; jobUrl: string | null }> = (props) => {
  return (
    <p className="is-size-7">
      <Icon className="fas fa-spinner fa-spin" />
      <span>
        Execute script since &nbsp;
        {props.startTime && displayDateTime(props.startTime)} &nbsp;
      </span>
      {props.jobUrl && (
        <a
          href={props.jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="is-family-monospace"
          style={{ textDecoration: 'underline' }}
        >
          View ansible job
        </a>
      )}
      {props.isEditable && (
        <>
          <br />
          <DuplicateTaskButton task={props.task} />
          <TaskStatusButton task={props.task} />
        </>
      )}
    </p>
  );
};

type ScriptPanelProps = WithScriptTask & { isEditable: boolean };
interface PreliminaryState {
  startTime: string | null;
  jobUrl: string | null;
}

const ScriptPanel: React.FC<ScriptPanelProps> = (props) => {
  const { task } = props;
  const [preliminaryState, setPreliminaryState] = React.useState<PreliminaryState>({
    startTime: task.startTime,
    jobUrl: task.jobUrl,
  });
  const onRunScriptTriggered = (resp: ScriptTask) => {
    setPreliminaryState({
      startTime: resp.startTime,
      jobUrl: resp.jobUrl,
    });
  };

  if (task.finishTime) return <ScriptDone task={task} isEditable={props.isEditable} />;
  else if (preliminaryState.startTime)
    return (
      <ScriptRunning
        startTime={preliminaryState.startTime}
        jobUrl={preliminaryState.jobUrl}
        task={task}
        isEditable={props.isEditable}
      />
    );
  else if (props.isEditable) return <RunScriptContainer task={task} onSubmitTriggered={onRunScriptTriggered} />;
  else return null;
};

export default ScriptPanel;
