import { ResourceProperty } from '../../api/resource';
import { RESOURCE_TYPE_OTHER } from '../../resource-type';
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
import { TicketWizardState } from './state';

const defaultState: TicketWizardState = {
  ticket: null,
  resources: [],
};

function getResourceById(resourceId: any, resources: ResourceProperty[]) {
  return resources.find((resource) => resource.id === resourceId);
}

export function ticketWizardReducer(state = defaultState, action: TicketWizardActionTypes): TicketWizardState {
  switch (action.type) {
    case INITIAL_TICKET_WITH_APPLICATION:
      return {
        ticket: {
          application: action.payload.application.id,
          approvers: null,
          dataCenter: null,
          jobCode: '',
          items: [],
        },
        resources: action.payload.resources,
      };
    case INITIAL_TICKET_WITH_EXISTING:
      const { ticket, approvement, resources } = action.payload;
      return {
        ticket: {
          application: ticket.application.id,
          dataCenter: ticket.dataCenter,
          jobCode: ticket.jobCode,
          items: ticket.items.map((item) => ({
            ...item,
            resource: item.resource && item.resource.id,
            pseudoId: item.id || new Date().getTime(),
          })),
          approvers: approvement.map((approver) => ({
            id: approver.approverId,
            user: approver.approver,
            level: approver.approverLevel,
          })),
        },
        resources: resources,
      };

    case DISCARD_TICKET:
      return {
        ticket: null,
        resources: [],
      };

    case ASSIGN_APPROVER:
      if (state.ticket) {
        return {
          ticket: {
            ...state.ticket,
            approvers: action.payload.approvers,
          },
          resources: state.resources,
        };
      } else return state;

    case SET_DATA_CENTER:
      if (state.ticket) {
        const { dataCenter, jobCode } = action.payload;
        return {
          ticket: {
            ...state.ticket,
            dataCenter,
            jobCode,
            items: state.ticket.items.filter((item) => {
              if (item.resource === undefined || item.resource === null) {
                if (item.resourceType === RESOURCE_TYPE_OTHER) return true;

                return dataCenter.availableResources ? dataCenter.availableResources.includes(item.resourceType) : true;
              }

              const resource = getResourceById(item.resource, state.resources);
              if (!resource) return false;

              return resource.dataCenter && resource.dataCenter.id === dataCenter.id && resource.jobCode === jobCode;
            }),
            approvers:
              state.ticket.dataCenter && dataCenter.id === state.ticket.dataCenter.id ? state.ticket.approvers : null,
          },
          resources: state.resources,
        };
      } else return state;

    case ADD_ITEM:
      if (state.ticket) {
        return {
          ticket: {
            ...state.ticket,
            items: state.ticket.items.concat([{ ...action.payload.item }]),
          },
          resources: state.resources,
        };
      } else return state;

    case REMOVE_ITEM:
      if (state.ticket) {
        return {
          ticket: {
            ...state.ticket,
            items: state.ticket.items.filter((obj) => obj.pseudoId !== action.payload.pseudoId),
          },
          resources: state.resources,
        };
      } else return state;

    case EDIT_ITEM:
      if (state.ticket) {
        return {
          ticket: {
            ...state.ticket,
            items: state.ticket.items.map((obj) =>
              obj.pseudoId === action.payload.pseudoId ? action.payload.item : obj,
            ),
          },
          resources: state.resources,
        };
      } else return state;

    case UPDATE_PRICE:
      if (state.ticket) {
        const { pseudoId, price, priceDetail } = action.payload;
        const items = state.ticket.items.map((item) => {
          if (item.pseudoId === pseudoId) {
            return {
              ...item,
              estimatedPrice: price,
              priceDetail,
            };
          }
          return item;
        });

        return {
          ticket: {
            ...state.ticket,
            items: items,
          },
          resources: state.resources,
        };
      } else return state;

    default:
      return state;
  }
}
