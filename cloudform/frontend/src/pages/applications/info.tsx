import { Button, Control, Field, Icon, Title } from 'bloomer';
import * as React from 'react';
import { useContext } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router';

import applicationApi, { ApplicationResponse } from '../../api/application';
import { ContentWrapper, DataField, LastUpdate, LinkButton } from '../../components';
import { enqueue } from '../../redux/snackbar';
import ApplicationContext from './context';
import ApplicationHeader from './header';

interface ApplicationInfoProps {
  application: ApplicationResponse;
  isReadOnly: boolean;
  onArchive: () => void;
}

const ApplicationInfo: React.FC<ApplicationInfoProps> = (props) => {
  const { application, isReadOnly } = props;
  const onArchive = () => {
    const isConfirm = window.confirm('Are you sure to archive this application?');
    if (isConfirm) props.onArchive();
  };

  return (
    <>
      <ApplicationHeader application={application} isReadOnly={isReadOnly} />
      <ContentWrapper>
        <Field isGrouped="right">
          {!isReadOnly && application.canDelete && (
            <Control>
              <Button onClick={onArchive} className="is-rounded">
                <Icon className="fas fa-archive" />
                <span>Archive</span>
              </Button>
            </Control>
          )}
          {!isReadOnly && (
            <Control>
              <LinkButton to="edit" icon="fa fa-edit" isColor="info" className="is-rounded">
                <span>Edit info</span>
              </LinkButton>
            </Control>
          )}
        </Field>

        <Title isSize={4}>Application Information</Title>
        <p data-field="description">{application.description}</p>
        {application.systemDiagram && (
          <>
            <br />
            <DataField dataField="systemDiagram" label="System Diagram">
              <span>{application.systemDiagram.split('/').slice(-1)}</span>&nbsp;
              <a href={application.systemDiagram} target="_blank" rel="noopener noreferrer">
                <Icon className="fas fa-download" />
                <span>Download</span>
              </a>
            </DataField>
          </>
        )}
        <hr />
        <Title isSize={4}>Application supporter</Title>
        <DataField label="Name" dataField="supporterName">
          {application.supporterName}
        </DataField>
        <DataField label="Email Address" dataField="supporterEmail">
          <a href={`mailto://${application.supporterEmail}`}>{application.supporterEmail}</a>
        </DataField>
        <DataField label="Department" dataField="supporterDepartment">
          {application.supporterDepartment}
        </DataField>
        <DataField label="Organization" dataField="supporterOrganization">
          {application.supporterOrganization}
        </DataField>
        <LastUpdate model={application} />
      </ContentWrapper>
    </>
  );
};

const ApplicationInfoPage: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
  const application = useContext(ApplicationContext);
  const dispatch = useDispatch();
  const history = useHistory();

  const onArchive = async () => {
    try {
      await applicationApi(dispatch).delete(application);

      history.push(`/projects/${application.project.id}` + (isReadOnly ? '?isReadOnly=true' : ''));
      dispatch(enqueue(`Application ${application.name} has been archived.`, 'success'));
    } catch (err) {
      console.error(err);
      dispatch(enqueue('Failed to archive the applciation.', 'danger'));
    }
  };

  return <ApplicationInfo application={application} isReadOnly={isReadOnly} onArchive={onArchive} />;
};

export default ApplicationInfoPage;
export { ApplicationInfo };
