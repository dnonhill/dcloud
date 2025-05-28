import '@testing-library/jest-dom';

import { cleanup, fireEvent, render } from '@testing-library/react';
import * as React from 'react';

import { ApproverLevelsProperty } from '../../../api/data-center';
import { ApproverStep, ApproverStepProps } from './approver-step';

const approverLevels: ApproverLevelsProperty[] = [
  {
    level: 1,
    approvers: [
      { id: 3, user: { id: 1001, username: 'aprv001', email: 'pitsanu+aprv001@thezouth.com', fullname: 'Pitsanu Sw' } },
    ],
  },
  {
    level: 2,
    approvers: [
      {
        id: 4,
        user: { id: 2001, username: 'aprv002', email: 'pitsanu+aprv002@thezouth.com', fullname: 'Lertwut Khan' },
      },
    ],
  },
  {
    level: 3,
    approvers: [
      { id: 5, user: { id: 2004, username: 'aprv003', email: 'john+aprv003@odds.team', fullname: 'John Doe' } },
    ],
  },
];

const props: ApproverStepProps = {
  approvers: null,
  approverLevels: approverLevels,
  onNext: () => {},
};

function createApproverStep(props: ApproverStepProps) {
  return render(
    <ApproverStep approvers={props.approvers} approverLevels={props.approverLevels} onNext={props.onNext} />,
  );
}

describe('Approver Step', () => {
  it('should render all approver levels', () => {
    const { queryByTestId } = createApproverStep(props);
    const aprvLevels = queryByTestId('approver-levels');
    expect(aprvLevels).not.toBeNull();

    if (aprvLevels) {
      const levels = aprvLevels.querySelectorAll('[data-testid*="approver-level-"]').length;
      expect(levels).toEqual(approverLevels.length);
    }
  });

  it('should render correct approver for each level', () => {
    const { queryByTestId } = createApproverStep(props);

    const aprvLevel1 = queryByTestId('approver-level-1');
    const aprvLevel2 = queryByTestId('approver-level-2');
    const aprvLevel3 = queryByTestId('approver-level-3');

    aprvLevel1 && expect(aprvLevel1.textContent).toContain('Pitsanu Sw');
    aprvLevel2 && expect(aprvLevel2.textContent).toContain('Lertwut Khan');
    aprvLevel3 && expect(aprvLevel3.textContent).toContain('John Doe');
  });

  it('should not be able to next when not select approver', () => {
    const { queryByTestId } = createApproverStep(props);
    const nextBtn = queryByTestId('approver-step-next');

    expect(nextBtn).toBeDisabled();
  });

  it('should be able to next when select all approvers', () => {
    const { queryByTestId } = createApproverStep(props);
    const nextBtn = queryByTestId('approver-step-next');

    const aprvLevel1 = queryByTestId('approver-level-1');
    const aprvLevel2 = queryByTestId('approver-level-2');
    const aprvLevel3 = queryByTestId('approver-level-3');

    aprvLevel1 && fireEvent.click(aprvLevel1.querySelector('a.approver')!);
    aprvLevel2 && fireEvent.click(aprvLevel2.querySelector('a.approver')!);
    aprvLevel3 && fireEvent.click(aprvLevel3.querySelector('a.approver')!);

    expect(nextBtn).not.toBeDisabled();
  });
});

const approvers = [
  { id: 5, user: { id: 2004, username: 'aprv003', email: 'john+aprv003@odds.team', fullname: 'John Doe' }, level: 3 },
  {
    id: 4,
    user: { id: 2001, username: 'aprv002', email: 'pitsanu+aprv002@thezouth.com', fullname: 'Lertwut Khan' },
    level: 2,
  },
  {
    id: 3,
    user: { id: 1001, username: 'aprv001', email: 'pitsanu+aprv001@thezouth.com', fullname: 'Pitsanu Sw' },
    level: 1,
  },
];

describe('Approver Step with selected approvers', () => {
  const propsWithApprovers = {
    ...props,
    approvers,
  };

  it('should pre-selected approvers for each level', () => {
    const { queryByTestId } = createApproverStep(propsWithApprovers);

    const aprvLevel1 = queryByTestId('approver-level-1');
    const aprvLevel2 = queryByTestId('approver-level-2');
    const aprvLevel3 = queryByTestId('approver-level-3');

    aprvLevel1 && expect(aprvLevel1.querySelector('a.approver')).toHaveClass('is-active');
    aprvLevel2 && expect(aprvLevel2.querySelector('a.approver')).toHaveClass('is-active');
    aprvLevel3 && expect(aprvLevel3.querySelector('a.approver')).toHaveClass('is-active');
  });
});

afterEach(cleanup);
