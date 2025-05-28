import { Dropdown, DropdownContent, DropdownMenu, DropdownTrigger, Icon, Tag } from 'bloomer';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { Link, useHistory, useLocation, useParams, useRouteMatch } from 'react-router-dom';

import projectApi, { ProjectResponse } from '../../api/project';
import { GROUP_CLOUD_ADMIN } from '../../api/user';
import {
  AppHeader,
  AppTitle,
  AttributeHeading,
  AttributeItem,
  AttributesBar,
  ContentWrapper,
  DeferRender,
  LastUpdate,
  TitleEyebrow,
} from '../../components';
import { UserTooltip } from '../../components/user-tooltip';
import { displayDate } from '../../formatter/date';
import { useUserProfile } from '../../redux/auth';
import { enqueue } from '../../redux/snackbar';
import { ApplicationsByProject } from '../applications/list';
import JobCodeModal from './modal';
import { TransferOwnerDialog, TransferProjectButton } from './transfer-owner';

interface WithProjectProps {
  project: ProjectResponse;
  isReadOnly?: boolean;
}

const DeleteProjectButton: React.FC<WithProjectProps & { className?: string }> = (props) => {
  const { project } = props;
  const dispatch = useDispatch();
  const history = useHistory();

  const handleClick = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const confirm = window.confirm(`Are you sure to archive project ${project.name}?`);
    if (!confirm) return;

    try {
      await projectApi(dispatch).delete(project.id);
      history.push('/projects');
      dispatch(enqueue(`Project ${project.name} has been archived.`, 'success'));
    } catch {
      dispatch(enqueue('Fail to archived the project', 'danger'));
    }
  };

  return (
    <a href="#/" role="button" onClick={handleClick} className={props.className}>
      <Icon className="fas fa-archive" />
      <span>Archive</span>
    </a>
  );
};

type ProjectAttributesProps = WithProjectProps & { canTransferProject: boolean };

const ProjectAttributes: React.FC<ProjectAttributesProps> = (props) => {
  const [isDialogVisible, setDialogVisibility] = React.useState(false);
  const [modalIsOpen, setModalIsOpen] = React.useState<boolean>(false);
  const match = useRouteMatch()!;
  const { project, isReadOnly = false } = props;

  const dispatch = useDispatch();
  const history = useHistory();
  const onTransferSuccess = () => {
    dispatch(enqueue('Project has been transfered.', 'success'));
    history.push(`/projects${isReadOnly ? '?isReadOnly=true' : ''}`);
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
        jobCodeNo={project.jobCode}
        modalTitle="Job Code Detail"
        modalCancelText="Close"
      />
      <AttributesBar>
        <AttributeItem>
          <AttributeHeading>Job code</AttributeHeading>
          <p data-field="jobCode" onClick={openJobCodeModal} className="has-text-primary is-clickable">
            {project.jobCode}
          </p>
        </AttributeItem>
        <AttributeItem>
          <AttributeHeading>Project owner</AttributeHeading>
          <UserTooltip user={project.owner} dataField="owner" />
        </AttributeItem>
        {project.goLiveDate && (
          <AttributeItem>
            <AttributeHeading>GoLive date</AttributeHeading>
            <p data-field="goLiveDate" data-value={project.goLiveDate}>
              {displayDate(project.goLiveDate)}
            </p>
          </AttributeItem>
        )}

        <AttributeItem>
          <AttributeHeading>Expired date</AttributeHeading>
          <p data-field="expiredDate" data-value={project.expiredDate}>
            {displayDate(project.expiredDate)}
          </p>
        </AttributeItem>
        {(!isReadOnly || props.canTransferProject) && (
          <AttributeItem>
            <Dropdown isHoverable>
              <DropdownTrigger className="has-text-link">
                <Icon className="far fa-list-alt" />
                <span>Actions</span>
                <Icon isSize="small" className="fas fa-angle-down" />
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownContent>
                  {isReadOnly || (
                    <Link data-action="edit" to={`${match.url}/edit`} className="dropdown-item">
                      <Icon className="fa fa-edit" />
                      <span>Edit</span>
                    </Link>
                  )}
                  {props.canTransferProject && (
                    <TransferProjectButton className="dropdown-item" setVisibility={setDialogVisibility} />
                  )}
                  {!isReadOnly && project.canDelete && (
                    <DeleteProjectButton className="dropdown-item" project={project} isReadOnly={isReadOnly} />
                  )}
                </DropdownContent>
              </DropdownMenu>
            </Dropdown>
          </AttributeItem>
        )}
      </AttributesBar>
      <LastUpdate model={project} />
      <TransferOwnerDialog
        isActive={isDialogVisible}
        onTransferSuccess={onTransferSuccess}
        projectId={project.id}
        onClose={() => setDialogVisibility(false)}
      />
    </>
  );
};

const ProjectView: React.FC<WithProjectProps> = ({ project, isReadOnly = false }) => {
  const user = useUserProfile();
  const canTransferProject =
    user !== undefined &&
    (user.id === project.owner.id || !!user.groups.find((g) => g.name === GROUP_CLOUD_ADMIN)) &&
    project.activeFlag;

  return (
    <>
      <AppHeader>
        <TitleEyebrow>Project</TitleEyebrow>
        <AppTitle>
          <span data-field="projectName">{project.name}</span>&nbsp;
          {project.activeFlag || <Tag isColor="grey">ARCHIVED</Tag>}
        </AppTitle>
      </AppHeader>
      <ContentWrapper>
        <ProjectAttributes project={project} isReadOnly={isReadOnly} canTransferProject={canTransferProject} />
        <ApplicationsByProject projectId={project.id} isReadOnly={isReadOnly} />
      </ContentWrapper>
    </>
  );
};

const ProjectViewPage: React.FC = () => {
  const { id: projectId } = useParams();
  const dispatch = useDispatch();
  const { search } = useLocation();
  const isReadOnly = new URLSearchParams(search).get('isReadOnly') === 'true';
  const projectLoader = React.useMemo(() => {
    if (!projectId) throw new Error('No project id supplied.');

    const param = isReadOnly ? { all: true } : {};
    return projectApi(dispatch).get(projectId, param);
  }, [dispatch, projectId, isReadOnly]);

  return (
    <DeferRender
      promise={projectLoader}
      render={(project) => <ProjectView isReadOnly={isReadOnly || !project.activeFlag} project={project} />}
    />
  );
};

export default ProjectViewPage;
