import { ApplicationResponse } from '../../api/application';
import { ApprovementBriefProperty } from '../../api/approvement';
import { ApproverProperty, DataCenterProperty } from '../../api/data-center';
import { PricingDetail } from '../../api/pricing';
import { ResourceProperty } from '../../api/resource';
import { TicketItemRequestWithPseudoId, TicketResponse } from '../../api/ticket';
import {
  ADD_ITEM,
  ASSIGN_APPROVER,
  DISCARD_TICKET,
  EDIT_ITEM,
  INITIAL_TICKET_WITH_APPLICATION,
  INITIAL_TICKET_WITH_EXISTING,
  REMOVE_ITEM,
  SET_DATA_CENTER,
  TicketWizardActionTypes,
  UPDATE_PRICE,
} from './action';

export function initialTicketWithApplication(
  application: ApplicationResponse,
  resources: ResourceProperty[],
): TicketWizardActionTypes {
  return {
    type: INITIAL_TICKET_WITH_APPLICATION,
    payload: { application, resources },
  };
}

export function initialTicketWithExisting(
  ticket: TicketResponse,
  approvement: ApprovementBriefProperty[],
  resources: ResourceProperty[],
): TicketWizardActionTypes {
  return {
    type: INITIAL_TICKET_WITH_EXISTING,
    payload: { ticket, approvement, resources },
  };
}

export function discardTicket(): TicketWizardActionTypes {
  return {
    type: DISCARD_TICKET,
  };
}

export function assignApprover(approvers: ApproverProperty[]): TicketWizardActionTypes {
  return {
    type: ASSIGN_APPROVER,
    payload: { approvers },
  };
}

export function addItem(item: TicketItemRequestWithPseudoId): TicketWizardActionTypes {
  return {
    type: ADD_ITEM,
    payload: { item },
  };
}

export function removeItem(pseudoId: number): TicketWizardActionTypes {
  return {
    type: REMOVE_ITEM,
    payload: { pseudoId },
  };
}

export function editItem(pseudoId: number, item: TicketItemRequestWithPseudoId): TicketWizardActionTypes {
  return {
    type: EDIT_ITEM,
    payload: { pseudoId, item },
  };
}

export function setDataCenter(dataCenter: DataCenterProperty, jobCode: string): TicketWizardActionTypes {
  return {
    type: SET_DATA_CENTER,
    payload: { dataCenter, jobCode },
  };
}

export function updatePrice(
  pseudoId: number,
  price: number,
  priceDetail: Array<PricingDetail>,
): TicketWizardActionTypes {
  return {
    type: UPDATE_PRICE,
    payload: { pseudoId, price, priceDetail },
  };
}
