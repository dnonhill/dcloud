import { Box, Column, Columns, Delete, Icon, Level, LevelLeft, LevelRight, Title } from 'bloomer';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import resourceApi, { ResourceRelationProperty } from '../../../api/resource';
import { ReactComponent as NotFoundIllustration } from '../../../asset/not_found.svg';
import { DeferRender, IllustratedMessage, IllustratedMessageIllustration } from '../../../components';
import { Tooltip } from '../../../components/tooltip';
import { enqueue } from '../../../redux/snackbar';
import { NewResourceRelationButton } from './create';

interface ResourceRelationProps {
  relation: ResourceRelationProperty;
  isReadOnly: boolean;
  onDelete: (relation: ResourceRelationProperty) => void;
}

const ResourceRelationItem: React.FC<ResourceRelationProps> = (props) => {
  return (
    <Column isSize="1/3">
      <Box>
        {props.isReadOnly || <Delete style={{ float: 'right' }} onClick={() => props.onDelete(props.relation)} />}
        <strong className="has-text-primary">
          <Tooltip
            text={props.relation.serviceInventoryName}
            tooltipText={props.relation.serviceInventoryDescription}
          />
        </strong>
        <p>
          <small>{props.relation.description}</small>
        </p>
      </Box>
    </Column>
  );
};

const NoRelation: React.FC = () => (
  <IllustratedMessage>
    <IllustratedMessageIllustration>
      <NotFoundIllustration />
    </IllustratedMessageIllustration>
    <p>
      <strong className="has-text-grey-light">No relation here.</strong>
    </p>
  </IllustratedMessage>
);

interface ResourceRelationListProps {
  items: ResourceRelationProperty[];
  isReadOnly: boolean;
}

export const ResourceRelationList: React.FC<ResourceRelationListProps> = (props) => {
  const dispatch = useDispatch();
  const [items, setItems] = useState(props.items);
  const deleteRelation = async (relation: ResourceRelationProperty) => {
    const relationId = relation.id;
    try {
      const willDelete = window.confirm('Are you sure to delete the relation?');
      if (willDelete) {
        await resourceApi(dispatch).deleteAppRelation(relationId);
        dispatch(enqueue('Delete relation successfully.', 'success'));
        setItems(items.filter((item) => item.id !== relationId));
      }
    } catch (err) {
      dispatch(enqueue(err.message || 'Error on submitting.', 'danger'));
    }
  };

  if (items.length <= 0) return <NoRelation />;

  return (
    <Columns isMultiline className="resourceRelation-items">
      {items.map((item) => (
        <ResourceRelationItem relation={item} isReadOnly={props.isReadOnly} onDelete={deleteRelation} />
      ))}
    </Columns>
  );
};

const ResourceRelation: React.FC<ResourceRelationListProps> = ({ isReadOnly, items }) => {
  const inboundRelations = items.filter((item) => item.relation === 'inbound');
  const outboundRelations = items.filter((item) => item.relation === 'outbound');

  return (
    <>
      <Level>
        <LevelLeft>
          <Title isSize={5}>
            <Icon className="fas fa-sign-in-alt fa-flip-horizontal" isSize="medium" />
            <span>Inbound</span>
          </Title>
        </LevelLeft>
        <LevelRight>{isReadOnly || <NewResourceRelationButton relation="inbound" />}</LevelRight>
      </Level>
      <ResourceRelationList items={inboundRelations} isReadOnly={isReadOnly} />
      <br />

      <Level>
        <LevelLeft>
          <Title isSize={5}>
            <Icon className="fas fa-sign-out-alt" isSize="medium" />
            <span>Outbound</span>
          </Title>
        </LevelLeft>
        <LevelRight>{isReadOnly || <NewResourceRelationButton relation="outbound" />}</LevelRight>
      </Level>
      <ResourceRelationList items={outboundRelations} isReadOnly={isReadOnly} />
    </>
  );
};

interface ResourceRelationPageProps {
  resourceId: string;
  isReadOnly: boolean;
}

const ResourceRelationPage: React.FC<ResourceRelationPageProps> = ({ isReadOnly, resourceId }) => {
  const dispatch = useDispatch();

  const loader = React.useMemo(async () => {
    return resourceApi(dispatch).listAppRelation({ resourceId });
  }, [dispatch, resourceId]);

  return (
    <DeferRender
      promise={loader}
      render={(response) => <ResourceRelation items={response.results} isReadOnly={isReadOnly} />}
    />
  );
};

export default ResourceRelationPage;
