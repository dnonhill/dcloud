import { ApproverProperty, DataCenterProperty } from '../../api/data-center';
import { ResourceProperty } from '../../api/resource';
import { TicketItemRequestWithPseudoId } from '../../api/ticket';

export interface TicketWizardAppState {
  ticketWizard?: TicketWizardState;
}

export interface TicketWizardProperty {
  application: number;
  dataCenter: DataCenterProperty | null;
  jobCode: string;
  items: TicketItemRequestWithPseudoId[];
  approvers: ApproverProperty[] | null;
}

export interface TicketWizardState {
  ticket: TicketWizardProperty | null;
  resources: ResourceProperty[];
}
