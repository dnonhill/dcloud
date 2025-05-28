import { Box, Level, LevelItem, LevelLeft, LevelRight, Tag } from 'bloomer';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import resourceApi, { BriefTicketItemProperty } from '../../api/resource';
import { DeferRender } from '../../components';
import { displayRelativeDate } from '../../formatter/date';

interface BriefTicketItemProps {
  items: BriefTicketItemProperty[];
  isReadOnly: boolean;
}

const HistoryRow: React.FC<{ ticketitem: BriefTicketItemProperty; isReadOnly: boolean }> = ({
  ticketitem,
  isReadOnly,
}) => (
  <Box data-id={ticketitem.id} className="ticketitem">
    <Level>
      <LevelLeft>
        <LevelItem>
          <div>
            <small className="is-family-secondary">TICKET NO</small>&nbsp;
            <Link to={`/tickets/${ticketitem.ticket}` + (isReadOnly ? '?isReadOnly=true' : '')}>
              <strong data-field="ticket-no">{ticketitem.ticketNo}</strong>
            </Link>
          </div>
          <Tag>{ticketitem.action}</Tag>
        </LevelItem>
      </LevelLeft>
      <LevelRight className="has-text-grey">
        <LevelItem>
          <small className="is-family-secondary">
            Requested by {ticketitem.ticketCreatedBy} &nbsp;
            <span>{displayRelativeDate(ticketitem.ticketCreatedAt)}</span>
          </small>
        </LevelItem>
      </LevelRight>
    </Level>
  </Box>
);

export const ResourceHistory: React.FC<BriefTicketItemProps> = ({ items, isReadOnly }) => {
  return (
    <>
      {items.map((item) => (
        <HistoryRow ticketitem={item} isReadOnly={isReadOnly} key={item.id} />
      ))}
    </>
  );
};

interface ResourceHistoryPageProps {
  resourceId: string;
  isReadOnly: boolean;
}

const ResourceHistoryPage: React.FC<ResourceHistoryPageProps> = ({ resourceId, isReadOnly }) => {
  const dispatch = useDispatch();

  const loader = React.useMemo(async () => {
    return resourceApi(dispatch).listResourceTicket(resourceId);
  }, [dispatch, resourceId]);

  return (
    <DeferRender
      promise={loader}
      render={(response) => <ResourceHistory items={response.results} isReadOnly={isReadOnly} />}
    />
  );
};

export default ResourceHistoryPage;
