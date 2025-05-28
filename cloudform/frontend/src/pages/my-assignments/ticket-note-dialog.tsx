import {
  Button,
  Delete,
  ModalCard,
  ModalCardBody,
  ModalCardFooter,
  ModalCardHeader,
  ModalCardTitle,
  TextArea,
} from 'bloomer';
import * as React from 'react';

import { Modal } from '../../components';

export interface TicketNoteDialogProps {
  isActive: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
}

const TicketNoteDialog: React.FC<TicketNoteDialogProps> = (props) => {
  const [note, setNote] = React.useState('');

  const handleSave = (_: React.SyntheticEvent) => {
    props.onSave(note);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value);

  return (
    <Modal isActive={props.isActive}>
      <ModalCard>
        <ModalCardHeader>
          <ModalCardTitle>Note to the requestor</ModalCardTitle>
          <Delete onClick={props.onClose} />
        </ModalCardHeader>
        <ModalCardBody>
          <TextArea name="note" onChange={handleChange} />
        </ModalCardBody>
        <ModalCardFooter>
          <Button isColor="primary" onClick={handleSave} data-action="submit-close">
            Close ticket
          </Button>
          <Button isColor="light" onClick={props.onClose}>
            Cancel
          </Button>
        </ModalCardFooter>
      </ModalCard>
    </Modal>
  );
};

export default TicketNoteDialog;
