import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardHeaderIcon,
  CardHeaderTitle,
  Column,
  Columns,
  Content,
  Control,
  Delete,
  Field,
  Heading,
  Icon,
  LevelItem,
  Modal,
  ModalCard,
  ModalCardBody,
  ModalCardFooter,
  ModalCardHeader,
  ModalCardTitle,
  Subtitle,
  Tag,
  TextArea,
  Title,
} from 'bloomer';
import { isNull } from 'lodash';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router';

import approvementsApi, { ApprovementBriefProperty, ApprovementResponse } from '../../api/approvement';
import { TicketResponse } from '../../api/ticket';
import { ReactComponent as Cancel } from '../../asset/cancel.svg';
import { ReactComponent as Done } from '../../asset/done.svg';
import {
  AppHeader,
  AppTitle,
  AttributeHeading,
  AttributeItem,
  AttributesBar,
  CollapsibleBox,
  CollapsibleIcon,
  ContentWrapper,
  DataField,
  DeferRender,
  IllustratedMessage,
  IllustratedMessageContent,
  IllustratedMessageIllustration,
  TitleEyebrow,
  useReload,
} from '../../components';
import { UserTooltip } from '../../components/user-tooltip';
import { displayDate, displayRelativeDate } from '../../formatter/date';
import { enqueue } from '../../redux/snackbar';
import { EstimatedPrice, TotalPricePanel } from '../pricing/pricing';
import JobCodeModal from '../projects/modal';
import { TicketItemHeader } from '../tickets/detail';
import { STATUS_COLOR_MAP } from '../tickets/formatter';
import { SpecificationContent } from '../tickets/resource-spec';

interface WithApprovementProps {
  approvement: ApprovementResponse;
}

const ApprovedStatus: React.FC = () => (
  <IllustratedMessage>
    <IllustratedMessageIllustration>
      <Done />
    </IllustratedMessageIllustration>
    <IllustratedMessageContent>
      <Title className="has-text-success">This ticket has been approved.</Title>
      <Subtitle className="has-text-success">Thank you for your cooperation</Subtitle>
    </IllustratedMessageContent>
  </IllustratedMessage>
);

const RejectedStatus: React.FC<WithApprovementProps> = ({ approvement }) => (
  <IllustratedMessage>
    <IllustratedMessageIllustration>
      <Cancel />
    </IllustratedMessageIllustration>
    <IllustratedMessageContent>
      <Title className="has-text-danger">This ticket has been rejected.</Title>
      <Subtitle className="has-text-danger">{approvement.reason}</Subtitle>
    </IllustratedMessageContent>
  </IllustratedMessage>
);

interface WithTicketProps {
  ticket: TicketResponse;
}

const TicketAttributes: React.FC<WithTicketProps & { openModal?: () => void }> = ({ ticket, openModal }) => (
  <AttributesBar>
    <AttributeItem>
      <AttributeHeading>Requested at</AttributeHeading>
      <p data-field="createdAt">{displayRelativeDate(ticket.createdAt)}</p>
    </AttributeItem>
    <AttributeItem>
      <AttributeHeading>Requestor</AttributeHeading>
      <UserTooltip user={ticket.createdBy} dataField="requestor" />
    </AttributeItem>
    <AttributeItem>
      <AttributeHeading>Data center</AttributeHeading>
      <p data-field="dataCenter">{ticket.dataCenter && ticket.dataCenter.name}</p>
    </AttributeItem>
    <AttributeItem>
      <AttributeHeading>Job code</AttributeHeading>
      <p data-field="jobCode" onClick={openModal} className="has-text-primary is-clickable">
        {ticket.jobCode}
      </p>
    </AttributeItem>
  </AttributesBar>
);

const TicketItems: React.FC<WithTicketProps> = ({ ticket }) => (
  <>
    <Title isSize={5}>Resources</Title>
    {ticket.items.map((item) => (
      <Card key={item.id}>
        <CollapsibleBox
          headerType={({ isOpen }) => (
            <CardHeader>
              <CardHeaderTitle style={{ flexWrap: 'wrap' }}>
                <TicketItemHeader ticketItem={item} />
                <EstimatedPrice item={item} />
              </CardHeaderTitle>
              {
                // If specification.message is exists, <RsourceValue> will not display
                // specification.message represent the request is special request 
                !item.specification?.message &&
                <ResourceValue specification={item.specification} />
              }
              <CardHeaderIcon>
                <CollapsibleIcon isOpen={isOpen} />
              </CardHeaderIcon>
            </CardHeader>
          )}
        >
          <CardContent>
            <SpecificationContent ticketItem={item} />
          </CardContent>
        </CollapsibleBox>
      </Card>
    ))}
  </>
);

interface ResourceValueProps {
  specification?: any;
}

const ResourceValue: React.FC<ResourceValueProps> = (props) => {
  const { specification } = props;
  const sumDiskSize =
    (specification.mainStorage || 0) +
    (specification.osDisk || 0) +
    (specification.additionalOsDisk || 0) +
    (specification.dataDisk1Size || 0) +
    (specification.dataDisk2Size || 0);
  return (
    <LevelItem>
      <div style={{ marginLeft: '16px;' }}>
        <span>
          <Icon isAlign="left" className="fas fa-microchip" />
          <span className="is-fullflex is-size-7 has-text-grey has-text-weight-normal" style={{ marginLeft: '8px' }}>
            {`${specification.cpu}`}
          </span>
          <span className="is-fullflex is-size-7 has-text-grey has-text-weight-normal" style={{ marginLeft: '4px' }}>
            Cores
          </span>
        </span>
        <span style={{ marginLeft: '8px' }}>
          <Icon isAlign="left" className="fas fa-memory" />
          <span className="is-fullflex is-size-7 has-text-grey has-text-weight-normal" style={{ marginLeft: '8px' }}>
            {`${specification.memory}`}
          </span>
          <span className="is-fullflex is-size-7 has-text-grey has-text-weight-normal" style={{ marginLeft: '4px' }}>
            GB
          </span>
        </span>
        <span style={{ marginLeft: '8px' }}>
          <Icon isAlign="left" className="fas fa-hdd" />
          <span className="is-fullflex is-size-7 has-text-grey has-text-weight-normal" style={{ marginLeft: '8px' }}>
            {`${sumDiskSize}`}
          </span>
          <span className="is-fullflex is-size-7 has-text-grey has-text-weight-normal" style={{ marginLeft: '4px' }}>
            GB
          </span>
        </span>
      </div>
    </LevelItem>
  );
};

const ProjectInfo: React.FC<WithTicketProps> = ({ ticket }) => (
  <Box>
    <TitleEyebrow>
      <small>Project</small>
    </TitleEyebrow>
    <Title isSize={6}>{ticket.project.name}</Title>

    <TitleEyebrow>
      <small>Application</small>
    </TitleEyebrow>
    <Title isSize={6}>{ticket.application.name}</Title>
    <Subtitle isSize={6} style={{ marginBottom: '1.0rem' }}>
      <small>{ticket.application.description}</small>
      <br />
      {ticket.application.systemDiagram && (
        <small>
          <a href={ticket.application.systemDiagram} target="_blank" rel="noopener noreferrer">
            <Icon className="fas fa-download" />
            <span>System diagram</span>
          </a>
        </small>
      )}
    </Subtitle>

    <DataField label="Owner">
      <UserTooltip user={ticket.project.owner} dataField="owner" />
    </DataField>
    {ticket.project.goLiveDate && <DataField label="GoLive">{displayDate(ticket.project.goLiveDate)}</DataField>}
  </Box>
);

interface WithApprovers {
  approvers: ApprovementBriefProperty[];
}

const ApproversInfo: React.FC<WithApprovers> = ({ approvers }) => {
  return (
    <Box>
      <TitleEyebrow>
        <small>Approvers</small>
      </TitleEyebrow>
      <Content>
        <ol>
          {approvers
            .sort((a, b) => a.approverLevel - b.approverLevel)
            .map((approver) => {
              const approveStatus = isNull(approver.isApproved)
                ? 'waiting'
                : approver.isApproved === true
                ? 'approved'
                : 'rejected';

              return (
                <li key={approver.id}>
                  <div className="is-flex">
                    <Heading className="mr-2">
                      <Tag
                        style={{ width: 85 }}
                        className="has-text-weight-bold"
                        isColor={STATUS_COLOR_MAP[approveStatus]}
                      >
                        {approveStatus}
                      </Tag>
                    </Heading>
                    <UserTooltip user={approver.approver} dataField={`approver level ${approver.approverLevel}`} />
                  </div>
                </li>
              );
            })}
        </ol>
      </Content>
    </Box>
  );
};

const ApproveButton: React.FC<{ onApprove: () => void; disabled: boolean }> = (props) => {
  return (
    <Button data-action="approve" isColor="success" onClick={props.onApprove} disabled={props.disabled}>
      <Icon className="fa fa-check" />
      <span>Approve</span>
    </Button>
  );
};

const RejectButton: React.FC<{ onReject: (reason: string) => void; disabled: boolean }> = (props) => {
  const { onReject } = props;
  const [isOpenDialog, setOpenDialog] = React.useState(false);
  const closeDialog = () => setOpenDialog(false);

  return (
    <>
      <Button data-action="reject" isColor="danger" onClick={() => setOpenDialog(true)} disabled={props.disabled}>
        <Icon className="fa fa-times" />
        <span>Reject</span>
      </Button>
      <ApprovementReasonDialog isActive={isOpenDialog} onSave={onReject} onClose={closeDialog} />
    </>
  );
};

type ApprovementReasonDialog = {
  isActive: boolean;
  onSave?: (reason: string) => void;
  onClose: () => void;
};

const ApprovementReasonDialog: React.FC<ApprovementReasonDialog> = (props) => {
  const [reason, setReason] = React.useState('');
  const isValid = !!reason;

  const handleSave = (_: React.SyntheticEvent) => {
    if (isValid) {
      props.onSave ? props.onSave(reason) : props.onClose();
    }
  };

  return (
    <Modal isActive={props.isActive}>
      <ModalCard>
        <ModalCardHeader>
          <ModalCardTitle>Reason to reject</ModalCardTitle>
          <Delete onClick={props.onClose} />
        </ModalCardHeader>
        <ModalCardBody>
          <TextArea name="reason" onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)} />
        </ModalCardBody>
        <ModalCardFooter>
          <Button isColor="primary" onClick={handleSave} disabled={!isValid} data-action="submit-reject">
            Save
          </Button>
          <Button isColor="light" onClick={props.onClose}>
            Cancel
          </Button>
        </ModalCardFooter>
      </ModalCard>
    </Modal>
  );
};

type ApprovementPanelProps = {
  onApprove: () => Promise<any>;
  onReject: (reason: string) => Promise<any>;
};

const ApprovementPanel: React.FC<ApprovementPanelProps> = (props) => {
  const [isSubmitting, setSubmitting] = React.useState(false);

  const onApprove = () => {
    const confirm = window.confirm(
      'The cost for your approved resources will be charged to your Department/Company. ' +
        'Are you sure to approve this ticket?',
    );

    if (confirm) {
      setSubmitting(true);
      return props.onApprove().finally(() => {
        setSubmitting(false);
      });
    }
  };

  const onReject = (reason: string) => {
    setSubmitting(true);
    props.onReject(reason).finally(() => {
      setSubmitting(false);
    });
  };

  const styles: React.CSSProperties = {
    position: 'fixed',
    width: '100%',
    height: '10vh',
    bottom: 0,
    left: 0,
    paddingTop: '0.5rem',
    background: '#FFF',
  };

  return (
    <div id="approvement-panel" style={styles}>
      <Columns isCentered isVCentered>
        <Column hasTextAlign="centered">
          {isSubmitting && (
            <span className="has-text-primary">
              <Icon className="fas fa-spinner" />
              <span>Submitting...</span>
            </span>
          )}
          <Field isGrouped="centered">
            <Control>
              <ApproveButton onApprove={onApprove} disabled={isSubmitting} />
            </Control>
            <Control>
              <RejectButton onReject={onReject} disabled={isSubmitting} />
            </Control>
          </Field>
        </Column>
      </Columns>
    </div>
  );
};

type ApprovementDetailProps = WithApprovementProps & {
  onApprove: () => Promise<any>;
  onReject: (reason: string) => Promise<any>;
  approvers: ApprovementBriefProperty[];
};

const ApprovementDetail: React.FC<ApprovementDetailProps> = (props) => {
  const { approvement, approvers, onApprove, onReject } = props;
  const [modalIsOpen, setModalIsOpen] = React.useState<boolean>(false);

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
        jobCodeNo={approvement.ticket.jobCode}
        modalTitle="Job Code Detail"
        modalCancelText="Close"
      />
      <AppHeader>
        <TitleEyebrow>Approvement</TitleEyebrow>
        <AppTitle data-field="ticket-no">{approvement.ticket.ticketNo}</AppTitle>
      </AppHeader>
      <ContentWrapper>
        <TicketAttributes ticket={approvement.ticket} openModal={openJobCodeModal} />
        {approvement.isApproved !== null &&
          (approvement.isApproved ? <ApprovedStatus /> : <RejectedStatus approvement={approvement} />)}

        <Columns>
          <Column isSize="1/3">
            <div>
              <ProjectInfo ticket={approvement.ticket} />
              <ApproversInfo approvers={approvers} />
            </div>
          </Column>
          <Column isSize="2/3">
            <TicketItems ticket={approvement.ticket} />
            <br />
            <TotalPricePanel items={approvement.ticket.items} />
          </Column>
        </Columns>

        <div style={{ paddingBottom: '3em' }} />
        {approvement.isApproved == null && <ApprovementPanel onApprove={onApprove} onReject={onReject} />}
      </ContentWrapper>
    </>
  );
};

const ApprovementDetailPage: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  const { id } = useParams();
  const [approvement, setApprovement] = React.useState<ApprovementResponse>();
  const { reloadFlag, reload } = useReload();

  const loader = React.useMemo(async () => {
    if (!id) throw new Error('Approvement ID is not identified');

    const approvement = await approvementsApi(dispatch).get(id);
    setApprovement(approvement);

    return approvement;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, id, reloadFlag]);

  const approvementLoader = React.useMemo(async () => {
    if (!approvement) throw new Error('Ticket ID is not identified');

    return await approvementsApi(dispatch).getByTicket(approvement.ticket.id);
  }, [dispatch, approvement]);

  async function handleApprovement(execution: Promise<any>, successText: string) {
    try {
      await execution;
      dispatch(enqueue(successText, 'success'));
      history.push('/approvements');
    } catch (err) {
      if (err.statusCode === 409) {
        reload();
      }
      dispatch(enqueue(err.message || 'Error while submit approvement', 'danger'));
      throw err;
    }
  }

  const onApprovement = () => {
    if (approvement) {
      const approveResult = approvementsApi(dispatch).approve(approvement.id, approvement.ticket.updatedAt);
      return handleApprovement(approveResult, `Ticket ${approvement.ticket.ticketNo} has been approved.`);
    } else {
      return Promise.reject('Blank approvement');
    }
  };

  const onReject = (reason: string) => {
    if (approvement) {
      const rejectResult = approvementsApi(dispatch).reject(approvement.id, reason, approvement.ticket.updatedAt);
      return handleApprovement(rejectResult, `Ticket ${approvement.ticket.ticketNo} has been rejected.`);
    } else {
      return Promise.reject('Blank approvement');
    }
  };

  return (
    <DeferRender
      promise={Promise.all([loader, approvementLoader])}
      render={([approvement, approvers]) => (
        <ApprovementDetail
          approvement={approvement}
          approvers={approvers}
          onApprove={onApprovement}
          onReject={onReject}
        />
      )}
    />
  );
};

export default ApprovementDetailPage;
export { TicketAttributes, ProjectInfo, TicketItems, ApproversInfo };
