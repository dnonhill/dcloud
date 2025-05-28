import { Breadcrumb, BreadcrumbItem, Tag } from 'bloomer';
import * as React from 'react';
import { Link } from 'react-router-dom';

import { ResourceDetailProperty } from '../../api/resource';
import { AppHeader, AppSubTitle, AppTitle, TitleEyebrow } from '../../components';
import { ResourceTypeIcon } from './content-extractor';

export interface WithResourceProps {
  resource: ResourceDetailProperty;
  isReadOnly?: boolean;
}

const MENU = {
  Specification: 'spec',
  History: 'history',
  'App Relation': 'relation',
};

const READ_ONLY_MENU = {
  Specification: 'spec?isReadOnly=true',
  History: 'history?isReadOnly=true',
  'App Relation': 'relation?isReadOnly=true',
};

export const Header: React.FC<WithResourceProps> = (props) => {
  const extraParam = props.isReadOnly ? '?isReadOnly=true' : '';
  return (
    <AppHeader subMenu={props.isReadOnly ? READ_ONLY_MENU : MENU}>
      <TitleEyebrow>Resource</TitleEyebrow>
      <AppTitle>
        <ResourceTypeIcon resourceType={props.resource.resourceType} isSize="large" />
        &nbsp;<span>{props.resource.name}</span>
        {props.resource.activeFlag || (
          <Tag color="grey" style={{ marginLeft: '1em' }}>
            ARCHIVED
          </Tag>
        )}
      </AppTitle>
      <AppSubTitle>
        <Breadcrumb>
          <ul>
            <BreadcrumbItem>
              <Link
                to={`/projects/${props.resource.project.id}${extraParam}`}
                className="has-text-info"
                data-field="project-name"
              >
                {props.resource.project.name}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link
                to={`/applications/${props.resource.application.id}${extraParam}`}
                className="has-text-info"
                data-field="application-name"
              >
                {props.resource.application.name}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link
                to={`/applications/${props.resource.application.id}/resources${extraParam}`}
                className="has-text-info"
                data-action="resources-link"
              >
                Resources
              </Link>
            </BreadcrumbItem>
          </ul>
        </Breadcrumb>
      </AppSubTitle>
    </AppHeader>
  );
};
