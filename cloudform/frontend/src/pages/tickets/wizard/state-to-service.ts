import { TicketItemRequestWithPseudoId, TicketRequest } from '../../../api/ticket';
import { TicketWizardProperty } from '../../../redux/ticket-wizard';
import { RESOURCE_TYPE_VM } from '../../../resource-type';

export function convertStateToRequest(state: TicketWizardProperty): TicketRequest | null {
  if (state.dataCenter == null || state.approvers == null) return null;
  return {
    application: state.application,
    dataCenter: state.dataCenter.id,
    jobCode: state.jobCode,
    items: state.items.map(augmentSpecification),
    approvers: state.approvers.map((approve) => approve.id),
  };
}

function augmentSpecification(item: TicketItemRequestWithPseudoId) {
  if (item.resourceType === RESOURCE_TYPE_VM) {
    const output = {
      ...item,
      specification: {
        ...item.specification,
        memoryMb: item.specification.memory ? item.specification.memory * 1024 : undefined,
      },
    };

    delete output.pseudoId;
    return output;
  }

  return item;
}
