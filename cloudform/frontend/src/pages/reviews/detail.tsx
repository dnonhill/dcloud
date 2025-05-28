import {
  Button,
  Column,
  Columns,
  Control,
  Delete,
  Field,
  Icon,
  Modal,
  ModalCard,
  ModalCardBody,
  ModalCardFooter,
  ModalCardHeader,
  ModalCardTitle,
  Subtitle,
  TextArea,
  Title,
} from 'bloomer';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';

import approvementsApi, { ApprovementBriefProperty } from '../../api/approvement';
import reviewsApi, { ReviewBriefProperty, ReviewResponse } from '../../api/review';
import reviewApi from '../../api/review';
import { ReactComponent as Cancel } from '../../asset/cancel.svg';
import { ReactComponent as Done } from '../../asset/done.svg';
import {
  AppHeader,
  AppTitle,
  CommentBox,
  ContentWrapper,
  DeferRender,
  IllustratedMessage,
  IllustratedMessageContent,
  IllustratedMessageIllustration,
  TitleEyebrow,
  useReload,
} from '../../components';
import { enqueue } from '../../redux/snackbar';
import { ApproversInfo, ProjectInfo, TicketAttributes, TicketItems } from '../approvements/detail';
import { TotalPricePanel } from '../pricing/pricing';
import JobCodeModal from '../projects/modal';

interface WithReviewProps {
  review: ReviewResponse;
}

const ApprovedStatus: React.FC = () => (
  <IllustratedMessage>
    <IllustratedMessageIllustration>
      <Done />
    </IllustratedMessageIllustration>
    <IllustratedMessageContent>
      <Title className="has-text-success">This ticket has been reviewed.</Title>
      <Subtitle className="has-text-success">Thank you for your cooperation</Subtitle>
    </IllustratedMessageContent>
  </IllustratedMessage>
);

const RejectedStatus: React.FC<WithReviewProps> = ({ review }) => (
  <IllustratedMessage>
    <IllustratedMessageIllustration>
      <Cancel />
    </IllustratedMessageIllustration>
    <IllustratedMessageContent>
      <Title className="has-text-danger">This ticket has been rejected.</Title>
      <Subtitle className="has-text-danger">{review.note}</Subtitle>
    </IllustratedMessageContent>
  </IllustratedMessage>
);

const CommentedStatus: React.FC<WithReviewProps> = ({ review }) => (
  <IllustratedMessage>
    <IllustratedMessageIllustration>
      <Cancel />
    </IllustratedMessageIllustration>
    <IllustratedMessageContent>
      <Title className="has-text-warning">This ticket has been commented.</Title>
    </IllustratedMessageContent>
  </IllustratedMessage>
);

type ReviewDetailProps = WithReviewProps & {
  onApprove: () => Promise<any>;
  onReject: (note: string) => Promise<any>;
  onComment: (note: string) => Promise<any>;
  comments: ReviewBriefProperty[];
  approvers: ApprovementBriefProperty[];
};

const ReviewDetail: React.FC<ReviewDetailProps> = (props) => {
  const { review, onApprove, onReject, onComment, comments, approvers } = props;

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
        jobCodeNo={review.ticket.jobCode}
        modalTitle="Job Code Detail"
        modalCancelText="Close"
      />
      <AppHeader>
        <TitleEyebrow>Review</TitleEyebrow>
        <AppTitle data-field="ticket-no">{review.ticket.ticketNo}</AppTitle>
      </AppHeader>
      <ContentWrapper>
        <TicketAttributes ticket={review.ticket} openModal={openJobCodeModal} />
        {review.isReviewed ? (
          <ApprovedStatus />
        ) : review.isReject !== null ? (
          review.isReject ? (
            <RejectedStatus review={review} />
          ) : (
            ''
          )
        ) : review.note !== null ? (
          <CommentedStatus review={review} />
        ) : (
          ''
        )}

        <Columns>
          <Column isSize="1/3">
            <div>
              <ProjectInfo ticket={review.ticket} />
              {approvers && <ApproversInfo approvers={approvers} />}
              {comments && <CommentBox comments={comments} />}
            </div>
          </Column>
          <Column isSize="2/3">
            <TicketItems ticket={review.ticket} />
            <br />
            <TotalPricePanel items={review.ticket.items} />
          </Column>
        </Columns>

        <div style={{ paddingBottom: '3em' }} />
        {review.isReviewed === false && review.isReject === null && review.ticket.status !== 'commented' && (
          <ReviewPanel onApprove={onApprove} onReject={onReject} onComment={onComment} />
        )}
      </ContentWrapper>
    </>
  );
};

type ReviewPanelProps = {
  onApprove: () => Promise<any>;
  onReject: (note: string) => Promise<any>;
  onComment: (note: string) => Promise<any>;
};

const ReviewPanel: React.FC<ReviewPanelProps> = (props) => {
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

  const onReject = (note: string) => {
    setSubmitting(true);
    props.onReject(note).finally(() => {
      setSubmitting(false);
    });
  };

  const onComment = (note: string) => {
    setSubmitting(true);
    props.onComment(note).finally(() => {
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
    <div id="ReviewNote" style={styles}>
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
              <CommentButton onComment={onComment} disabled={isSubmitting} />
            </Control>
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

const ApproveButton: React.FC<{ onApprove: () => void; disabled: boolean }> = (props) => {
  return (
    <Button data-action="approve" isColor="success" onClick={props.onApprove} disabled={props.disabled}>
      <Icon className="fa fa-check" />
      <span>Approve</span>
    </Button>
  );
};

const RejectButton: React.FC<{ onReject: (note: string) => void; disabled: boolean }> = (props) => {
  const { onReject } = props;
  const [isOpenDialog, setOpenDialog] = React.useState(false);
  const closeDialog = () => setOpenDialog(false);

  return (
    <>
      <Button data-action="reject" isColor="danger" onClick={() => setOpenDialog(true)} disabled={props.disabled}>
        <Icon className="fa fa-times" />
        <span>Reject</span>
      </Button>
      <ReviewNoteDialog
        isActive={isOpenDialog}
        onSave={onReject}
        onClose={closeDialog}
        titleDialog="Note to Reject"
        dataAction="submit-reject"
      />
    </>
  );
};

const CommentButton: React.FC<{ onComment: (note: string) => void; disabled: boolean }> = (props) => {
  const { onComment } = props;
  const [isOpenDialog, setOpenDialog] = React.useState(false);
  const closeDialog = () => setOpenDialog(false);

  return (
    <>
      <Button data-action="comment" isColor="warning" onClick={() => setOpenDialog(true)} disabled={props.disabled}>
        <Icon className="fa fa-sticky-note" />
        <span>Comment</span>
      </Button>
      <ReviewNoteDialog
        isActive={isOpenDialog}
        onSave={onComment}
        onClose={closeDialog}
        titleDialog="Note for Requester"
        dataAction="submit-comment"
      />
    </>
  );
};

type ReviewNoteDialog = {
  dataAction: string;
  titleDialog: string;
  isActive: boolean;
  onSave?: (note: string) => void;
  onClose: () => void;
};

const ReviewNoteDialog: React.FC<ReviewNoteDialog> = (props) => {
  const [note, setNote] = React.useState('');
  const isValid = !!note;

  const handleSave = (_: React.SyntheticEvent) => {
    if (isValid) {
      props.onSave ? props.onSave(note) : props.onClose();
    }
  };

  return (
    <Modal isActive={props.isActive}>
      <ModalCard>
        <ModalCardHeader>
          <ModalCardTitle>{props.titleDialog}</ModalCardTitle>
          <Delete onClick={props.onClose} />
        </ModalCardHeader>
        <ModalCardBody>
          <TextArea name="note" onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)} />
        </ModalCardBody>
        <ModalCardFooter>
          <Button isColor="primary" onClick={handleSave} disabled={!isValid} data-action={props.dataAction}>
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

const ReviewDetailPage: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { reloadFlag, reload } = useReload();
  const [review, setReview] = React.useState<ReviewResponse>();
  const { id } = useParams();
  const loader = React.useMemo(async () => {
    if (!id) throw new Error('review ID is not identified');

    const review = await reviewsApi(dispatch).get(id);
    const comments = await reviewsApi(dispatch).getByTicket(review.ticket.id);
    const approvers = await approvementsApi(dispatch).getByTicket(review.ticket.id);

    setReview(review);

    return { review, comments, approvers };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, id, reloadFlag]);

  async function handleReview(execution: Promise<any>, successText: string) {
    try {
      await execution;
      dispatch(enqueue(successText, 'success'));
      history.push('/reviews');
    } catch (err) {
      if (err.statusCode === 409) {
        reload();
      }
      dispatch(enqueue(err.message || 'Error while submit approvement', 'danger'));
      throw err;
    }
  }

  const onApprove = () => {
    if (review) {
      const approveResult = reviewApi(dispatch).approve(review.id, review.ticket.updatedAt);
      return handleReview(approveResult, `Ticket ${review.ticket.ticketNo} has been approved.`);
    } else {
      return Promise.reject('Blank approvement');
    }
  };

  const onReject = (note: string) => {
    if (review) {
      const rejectResult = reviewsApi(dispatch).reject(review.id, note, review.ticket.updatedAt);
      return handleReview(rejectResult, `Ticket ${review.ticket.ticketNo} has been rejected.`);
    } else {
      return Promise.reject('Blank approvement');
    }
  };

  const onComment = (note: string) => {
    if (review) {
      const rejectResult = reviewsApi(dispatch).comment(review.id, note, review.ticket.updatedAt);
      return handleReview(rejectResult, `Ticket ${review.ticket.ticketNo} has been commented.`);
    } else {
      return Promise.reject('Blank approvement');
    }
  };

  return (
    <DeferRender
      promise={loader}
      render={({ review, comments, approvers }) => (
        <ReviewDetail
          review={review}
          onApprove={onApprove}
          onReject={onReject}
          onComment={onComment}
          comments={comments}
          approvers={approvers}
        />
      )}
    />
  );
};

export default ReviewDetailPage;
