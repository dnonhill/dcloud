import { Action } from 'redux';

import { ApplicationResponse } from '../../api/application';
import { ApprovementBriefProperty } from '../../api/approvement';
import { ApproverProperty, DataCenterProperty } from '../../api/data-center';
import { PricingDetail } from '../../api/pricing';
import { ResourceProperty } from '../../api/resource';
import { TicketItemRequestWithPseudoId, TicketResponse } from '../../api/ticket';

export const INITIAL_TICKET_WITH_APPLICATION = 'initial_ticket_with_application';
export const INITIAL_TICKET_WITH_EXISTING = 'initial_ticket_with_existing';
export const DISCARD_TICKET = 'discard_ticket';
export const ADD_ITEM = 'add_item';
export const ASSIGN_APPROVER = 'assign_approver';
export const SET_DATA_CENTER = 'set_data_center';
export const REMOVE_ITEM = 'remove_item';
export const EDIT_ITEM = 'edit_item';
export const UPDATE_PRICE = 'update_price';

interface InitialWithApplicationAction extends Action {
  type: typeof INITIAL_TICKET_WITH_APPLICATION;
  payload: { application: ApplicationResponse; resources: ResourceProperty[] };
}

interface InitialWithTicketAction extends Action {
  type: typeof INITIAL_TICKET_WITH_EXISTING;
  payload: { ticket: TicketResponse; approvement: ApprovementBriefProperty[]; resources: ResourceProperty[] };
}

interface DiscardTicketAction extends Action {
  type: typeof DISCARD_TICKET;
}

interface AddItemAction extends Action {
  type: typeof ADD_ITEM;
  payload: { item: TicketItemRequestWithPseudoId };
}

interface RemoveItemAction extends Action {
  type: typeof REMOVE_ITEM;
  payload: { pseudoId: number };
}

interface EditItemAction extends Action {
  type: typeof EDIT_ITEM;
  payload: { pseudoId: number; item: TicketItemRequestWithPseudoId };
}

interface AssignApprover extends Action {
  type: typeof ASSIGN_APPROVER;
  payload: { approvers: ApproverProperty[] };
}

interface SetDataCenter extends Action {
  type: typeof SET_DATA_CENTER;
  payload: { dataCenter: DataCenterProperty; jobCode: string };
}

interface UpdatePriceAction extends Action {
  type: typeof UPDATE_PRICE;
  payload: { pseudoId: number; price: number; priceDetail: Array<PricingDetail> };
}

export type TicketWizardActionTypes =
  | InitialWithApplicationAction
  | InitialWithTicketAction
  | DiscardTicketAction
  | AddItemAction
  | RemoveItemAction
  | EditItemAction
  | AssignApprover
  | SetDataCenter
  | UpdatePriceAction;
