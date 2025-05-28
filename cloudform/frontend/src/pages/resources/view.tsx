import { Icon } from 'bloomer';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import * as Router from 'react-router-dom';
import { useLocation } from 'react-router-dom';

import resourceApi from '../../api/resource';
import { DeferRender, LinkButton } from '../../components';
import { DetailContent } from './content-extractor';
import { WithResourceProps } from './header';

const ResourceDetail: React.FC<WithResourceProps> = (props) => (
  <>
    <p className="has-text-right">
      {props.isReadOnly || (
        <LinkButton
          to={
            `/applications/${props.resource.application.id}/` +
            `new-ticket/init-dc?data-center=${props.resource.dataCenter.id}&job-code=${props.resource.jobCode}`
          }
          isSize="small"
          isColor="primary"
        >
          <Icon className="fas fa-pencil-alt" />
          <span>Update resource</span>
        </LinkButton>
      )}
    </p>
    <DetailContent resource={props.resource} />
  </>
);

const ResourceViewPage: React.FC = (props) => {
  const { id } = Router.useParams();
  const dispatch = useDispatch();
  const { search } = useLocation();
  const isReadOnly = new URLSearchParams(search).get('isReadOnly') === 'true';

  const resourceLoader = React.useMemo(async () => {
    if (!id) throw Error('No Resource ID specified.');

    return resourceApi(dispatch).get(id);
  }, [dispatch, id]);

  return (
    <DeferRender
      promise={resourceLoader}
      render={(resource) => <ResourceDetail resource={resource} isReadOnly={isReadOnly} />}
    />
  );
};

export default ResourceViewPage;
export { ResourceDetail };
