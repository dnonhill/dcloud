import { Icon } from 'bloomer';
import * as React from 'react';
import { useLocation } from 'react-router';

import config from '../config';

interface DocButtonProps {
  docSiteUrl: string;
  q?: string;
}

const DocButton: React.FC<DocButtonProps> = (props) => {
  const url = props.docSiteUrl + (props.q ? '?code=' + props.q : '');
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="has-text-white" style={{ paddingTop: '0.25em' }}>
      <Icon className="fas fa-question-circle" />
    </a>
  );
};

export interface RouterMapper {
  pattern: RegExp;
  key: string;
}

function extractQueryKey(path: string, routerMappers: RouterMapper[]): string | undefined {
  for (let mapper of routerMappers) {
    if (mapper.pattern.test(path)) return mapper.key;
  }

  return undefined;
}

const ROUTE_MAPPERS: RouterMapper[] = [
  { pattern: /ticket(.*?)data-center/, key: 'ticket.data-center' },
  { pattern: /ticket(.*?)vm/, key: 'ticket.resource.vm' },
  { pattern: /ticket(.*?)container/, key: 'ticket.resource.openshift' },
  { pattern: /ticket(.*?)resources/, key: 'ticket.resource' },
  { pattern: /ticket(.*?)approver/, key: 'ticket.approver' },
  { pattern: /tickets\/(\d+)/, key: 'ticket.detail' },
  { pattern: /ticket/, key: 'ticket' },
  { pattern: /resources(.*?)relation\/add/, key: 'resource.app-relation.add' },
  { pattern: /resources(.*?)relation/, key: 'resource.app-relation' },
  { pattern: /resources(.*?)history/, key: 'resource.history' },
  { pattern: /resources(.*?)spec/, key: 'resource.detail' },
  { pattern: /resources/, key: 'resource' },
  { pattern: /applications\/new/, key: 'project.application.new' },
  { pattern: /applications(.*?)edit/, key: 'project.application.edit' },
  { pattern: /applications(.*?)info/, key: 'project.application.info' },
  { pattern: /applications/, key: 'project.application' },
  { pattern: /projects\/new/, key: 'project.new' },
  { pattern: /projects(.*?)edit/, key: 'project.edit' },
  { pattern: /projects\/(\d+)/, key: 'project.detail' },
  { pattern: /projects/, key: 'project' },
  { pattern: /search/, key: 'search-center' },
  { pattern: /approvements\/(\d+)/, key: 'approvement.detail' },
  { pattern: /approvements/, key: 'approvement' },
  { pattern: /my-assignments/, key: 'operation' },
  { pattern: /assignments/, key: 'assignments' },
];

const DocButtonByRoute: React.FC = (props) => {
  const location = useLocation();
  const path = location.pathname + location.search;

  const q = React.useMemo(() => extractQueryKey(path, ROUTE_MAPPERS), [path]);
  return <DocButton docSiteUrl={config.DOC_HOST} q={q} />;
};

export { DocButton, DocButtonByRoute };
