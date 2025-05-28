import { Button, Control, Field, Label, Panel, PanelBlock, PanelHeading, PanelIcon, TextArea } from 'bloomer';
import * as React from 'react';

import { BriefUser } from '../../api/user';
import { Modal } from '../../components';

export interface AssignDialogProps {
  allOperators: BriefUser[];
  onAssigneeSelected: (assigneeId: number, note: string) => void;
  isActive: boolean;
  onClose: () => void;
  note?: string;
}

export const AssignDialog: React.FC<AssignDialogProps> = (props) => {
  const [assignee, setAssignee] = React.useState<number>();
  const isValid = !!assignee;
  const [note, seNote] = React.useState('');

  React.useEffect(() => {
    seNote(props.note || '');
  }, [props.note]);

  const handleSubmit = () => {
    if (assignee !== undefined) {
      props.onAssigneeSelected(assignee, note);
    }
    console.log('Submit');
    seNote('');
  };

  const onKeyUp = (event: any) => {
    console.log('Keyup');
    seNote(event.target.value);
  };
  return (
    <Modal isActive={props.isActive}>
      <Panel style={{ zIndex: 10, minWidth: '80rem', minHeight: '40rem', backgroundColor: 'white' }}>
        <PanelHeading>Assignment</PanelHeading>
        <div className="columns">
          <div className="column is-one-third ">
            <Label style={{ padding: '1rem' }}>Operators</Label>
            <div style={{ overflowY: 'scroll', height: 400 }}>
              {props.allOperators.map((operator) => (
                <div style={{ paddingRight: '1rem' }} key={operator.id}>
                  <PanelBlock
                    key={operator.id}
                    tag="a"
                    className="is-radiusless operator-list"
                    isActive={operator.id === assignee}
                    onClick={() => setAssignee(operator.id)}
                  >
                    <PanelIcon className={operator.id === assignee ? 'fas fa-check' : ''} />
                    {/* {operator.firstName}&nbsp;{operator.lastName} */}
                    <div>
                      {operator.firstName}&nbsp;{operator.lastName}
                    </div>
                  </PanelBlock>
                </div>
              ))}
            </div>
          </div>
          <div style={{ border: 'solid gray 1px', marginTop: '23px' }}></div>
          <div className="column">
            <Field style={{ padding: '1rem' }}>
              <Label>Note</Label>
              <Control>
                <TextArea
                  placeholder={'Note ...'}
                  onKeyUp={onKeyUp}
                  defaultValue={note}
                  style={{ height: 390 }}
                ></TextArea>
              </Control>
            </Field>
          </div>
        </div>
        <PanelBlock style={{ background: '#FFF', justifyContent: 'center' }}>
          <Field isGrouped>
            <Control>
              <Button isColor="primary" onClick={handleSubmit} disabled={!isValid} data-action="submit-assign">
                Assign
              </Button>
            </Control>
            <Control>
              <Button isColor="light" onClick={props.onClose} data-action="cancel">
                Cancel
              </Button>
            </Control>
          </Field>
        </PanelBlock>
      </Panel>
    </Modal>
  );
};
