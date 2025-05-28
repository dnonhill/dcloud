import { Button, Control, Field, Panel, PanelBlock, PanelHeading, PanelIcon } from 'bloomer';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect } from 'react-router';

import dataCenterApi, { ApproverLevelsProperty, ApproverProperty } from '../../../api/data-center';
import { DeferRender } from '../../../components';
import { ApplicationState } from '../../../redux/state';
import { assignApprover, TicketWizardProperty } from '../../../redux/ticket-wizard';

export interface ApproverStepProps {
  approvers: ApproverProperty[] | null;
  approverLevels: ApproverLevelsProperty[];
  onNext: (approvers: ApproverProperty[]) => void;
}

const ApproverStep: React.FC<ApproverStepProps> = (props) => {
  const [selected, setSelected] = React.useState<ApproverProperty[]>(props.approvers || []);

  const { onNext } = props;
  const nextHandler = React.useCallback(() => {
    if (selected) {
      onNext(selected);
    }
  }, [selected, onNext]);

  const isSelected = (approver: ApproverProperty | null) => {
    if (selected && approver) {
      const select = selected.find((sel) => {
        return sel.id === approver.id;
      });

      return select ? true : false;
    } else return undefined;
  };

  const onSelected = (approver: ApproverProperty, level: number) => {
    if (selected) {
      let arr = [];
      arr = [...selected];
      arr = arr.filter((aprv) => aprv.level !== level);
      approver.level = level;
      arr.push(approver);

      setSelected(arr);
    }
  };

  return (
    <div data-testid="approver-levels">
      {props.approverLevels.map((level) => {
        return (
          <Panel key={level.level} data-testid={`approver-level-${level.level}`}>
            <PanelHeading className="has-text-weight-bold">Approvers - {level.level}</PanelHeading>
            {level.approvers.length > 0 ? (
              level.approvers.map((approver) => (
                <PanelBlock
                  className="approver"
                  tag="a"
                  key={approver.id}
                  isActive={isSelected(approver)}
                  onClick={() => {
                    onSelected(approver, level.level);
                  }}
                >
                  <PanelIcon className={isSelected(approver) ? 'fas fa-check' : ''} />
                  {approver.user.fullname || approver.user.username}
                </PanelBlock>
              ))
            ) : (
              <Redirect to="data-center" />
            )}
          </Panel>
        );
      })}

      <Field>
        <Control>
          <Button
            isColor="primary"
            data-action="proceed"
            disabled={selected && selected.length === props.approverLevels.length ? false : true}
            onClick={nextHandler}
            data-testid="approver-step-next"
          >
            Next
          </Button>
        </Control>
      </Field>
    </div>
  );
};

interface ApproverStepPageProps {
  onNext: () => void;
}

const ApproverStepPage: React.FC<ApproverStepPageProps> = ({ onNext }) => {
  const ticket = useSelector<ApplicationState, TicketWizardProperty>((state) => state.ticketWizard.ticket!);
  const dispatch = useDispatch();
  const dataCenter = ticket!.dataCenter;

  const approverLoader = React.useMemo(async () => {
    if (dataCenter) {
      const response = await dataCenterApi(dispatch).queryApprovers(dataCenter.id);
      return response;
    } else {
      return [];
    }
  }, [dispatch, dataCenter]);

  const onNextWrapper = (approvers: ApproverProperty[]) => {
    dispatch(assignApprover(approvers));
    onNext();
  };

  return (
    <DeferRender
      promise={approverLoader}
      render={(approverLevels) => {
        return approverLevels.length > 0 ? (
          <ApproverStep approverLevels={approverLevels} approvers={ticket.approvers} onNext={onNextWrapper} />
        ) : (
          <Redirect to="data-center" />
        );
      }}
    />
  );
};

export default ApproverStepPage;
export { ApproverStep };
