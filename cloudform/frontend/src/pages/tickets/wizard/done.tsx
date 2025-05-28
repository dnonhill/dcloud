import { Control, Field, Subtitle, Title } from 'bloomer';
import * as React from 'react';
import { useLocation } from 'react-router';

import { ReactComponent as DoneImage } from '../../../asset/done.svg';
import { IllustratedPage, LinkButton } from '../../../components';

const DonePage: React.FC = () => {
  const queryParam = new URLSearchParams(useLocation().search);
  const ticketNo = queryParam.get('ticket-no');
  const ticketId = queryParam.get('ticket-id');

  return (
    <IllustratedPage>
      <DoneImage />
      <Title>
        Your ticket <span data-field="ticketNo">{ticketNo}</span> has been accept
      </Title>
      <Subtitle>
        Thank you for your orders. This ticket will be forwarded to the approver and we'll serve you very soon.
      </Subtitle>
      <Field isGrouped="centered">
        {ticketId && (
          <Control>
            <LinkButton isColor="info" to={`/tickets/${ticketId}`} className="is-rounded">
              View my ticket
            </LinkButton>
          </Control>
        )}
        <Control>
          <LinkButton isColor="light" to="data-center" className="is-rounded">
            Create more ticket
          </LinkButton>
        </Control>
      </Field>
    </IllustratedPage>
  );
};

export default DonePage;
