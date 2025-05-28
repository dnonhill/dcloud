import { Tag } from 'bloomer';
import { Breadcrumb } from 'bloomer/lib/components/Breadcrumb/Breadcrumb';
import { BreadcrumbItem } from 'bloomer/lib/components/Breadcrumb/BreadcrumbItem';
import * as React from 'react';
import { Link } from 'react-router-dom';

import { ApplicationResponse } from '../../api/application';
import { AppHeader, AppSubTitle, AppTitle, TitleEyebrow } from '../../components';

const MENU = {
  'App Info': 'info',
  Resources: 'resources',
  Tickets: 'tickets',
};

const READ_ONLY_MENU = {
  'App Info': 'info?isReadOnly=true',
  Resources: 'resources?isReadOnly=true',
  Tickets: 'tickets?isReadOnly=true',
};

interface Props {
  application: ApplicationResponse;
}

const ApplicationHeader: React.FC<{ application: ApplicationResponse; isReadOnly: boolean }> = (props) => {
  const { application, isReadOnly } = props;
  const project = application.project;

  return (
    <AppHeader subMenu={isReadOnly ? READ_ONLY_MENU : MENU}>
      <TitleEyebrow>Application</TitleEyebrow>
      <AppTitle>
        <span data-field="name">{application.name}</span>&nbsp;
        {application.activeFlag || <Tag>Archived</Tag>}
      </AppTitle>
      <AppSubTitle>
        <Breadcrumb>
          <ul>
            <BreadcrumbItem>
              <Link
                to={`/projects/${project.id}` + (isReadOnly ? '?isReadOnly=true' : '')}
                className="has-text-info"
                data-field="project-name"
              >
                {project.name}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link to="#">Application</Link>
            </BreadcrumbItem>
          </ul>
        </Breadcrumb>
      </AppSubTitle>
    </AppHeader>
  );
};

export default ApplicationHeader;
