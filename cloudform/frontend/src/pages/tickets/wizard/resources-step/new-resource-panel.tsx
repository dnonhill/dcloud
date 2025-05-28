import { Column, Columns, Media, MediaContent, MediaLeft, Title } from 'bloomer';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';

import { LinkButton } from '../../../../components';
import { ApplicationState } from '../../../../redux/state';
import { TicketWizardProperty } from '../../../../redux/ticket-wizard';
import { RESOURCE_TYPE_CONTAINER, RESOURCE_TYPE_OTHER, RESOURCE_TYPE_VM } from '../../../../resource-type';

interface NewResourceButtonProps {
  url: string;
  icon: string;
  title: string;
  description: string;
  field: string;
}

export const NewResourceButton: React.FC<NewResourceButtonProps> = (props) => {
  const { url, icon, title, description, field } = props;

  return (
    <Media>
      <MediaLeft>
        <LinkButton to={url} isColor="link" isOutlined icon={icon} />
      </MediaLeft>
      <MediaContent>
        <Link to={url} data-action={`create-${field}`} className="has-text-weight-bold">
          {title}
        </Link>
        <p className="is-size-7">{description}</p>
      </MediaContent>
    </Media>
  );
};

const AddResourcePanel: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const ticket = useSelector<ApplicationState, TicketWizardProperty>((state) => state.ticketWizard.ticket!);
  const availableResources =
    ticket.dataCenter && ticket.dataCenter.availableResources ? ticket.dataCenter.availableResources : [];

  return (
    <>
      <Title isSize={6}>Add more instance</Title>
      <Columns isDesktop>
        {availableResources.includes('vm') && (
          <Column>
            <NewResourceButton
              url={`${pathname}/new?type=${RESOURCE_TYPE_VM}`}
              icon="fas fa-server"
              title="Virtual machine"
              field="vm"
              description="High quality virtual machine with care free 7x24 support."
            />
          </Column>
        )}
        {availableResources.includes(RESOURCE_TYPE_CONTAINER) && (
          <Column>
            <NewResourceButton
              url={`${pathname}/new?type=${RESOURCE_TYPE_CONTAINER}`}
              icon="fas fa-cloud"
              title="Openshift project"
              field="container-cluster"
              description="Build, deploy and mange your application on container platform."
            />
          </Column>
        )}
        {availableResources.includes('other') && (
          <Column>
            <NewResourceButton
              url={`${pathname}/new?type=${RESOURCE_TYPE_OTHER}`}
              icon="fas fa-magic"
              title="Special request"
              field="other"
              description="We're welcome to serve your request."
            />
          </Column>
        )}
      </Columns>
    </>
  );
};

export default AddResourcePanel;
