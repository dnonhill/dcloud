import { ApplicationResponse } from '../../api/application';
import { ApprovementBriefProperty } from '../../api/approvement';
import { ApproverProperty } from '../../api/data-center';
import { ResourceProperty } from '../../api/resource';
import { TicketItemRequestWithPseudoId, TicketResponse } from '../../api/ticket';
import { RESOURCE_TYPE_CONTAINER, RESOURCE_TYPE_VM } from '../../resource-type';
import * as actions from './creator';
import { initialTicketWithExisting } from './creator';
import { ticketWizardReducer as reducer } from './reducer';
import { TicketWizardProperty, TicketWizardState } from './state';

const app: ApplicationResponse = {
  id: 1,
  name: 'hell app',
  description: 'description',
  systemDiagram: null,
  project: {
    id: 2,
    jobCode: '',
    name: 'hello project',
    expiredDate: '',
    goLiveDate: null,
    activeFlag: true,
    owner: { id: 1, fullname: '' },
    createdAt: '',
    createdBy: { id: 1, username: 'hello', fullname: 'hello' },
    updatedAt: '',
    updatedBy: { id: 1, username: 'hello', fullname: 'hello' },
  },
  supporterName: 'hello',
  supporterEmail: 'hello@world.com',
  supporterDepartment: 'part of the world',
  supporterOrganization: 'world',
  createdAt: '',
  createdBy: { id: 1, username: 'hello', fullname: 'hello' },
  updatedAt: '',
  updatedBy: { id: 1, username: 'hello', fullname: 'hello' },
  canDelete: false,
  activeFlag: true,
};
const ticket: TicketWizardProperty = { application: 1, dataCenter: null, jobCode: '', approver: null, items: [] };
const pseudoId1 = new Date().getTime();
const pseudoId2 = pseudoId1 + 1;
const item1: TicketItemRequestWithPseudoId = {
  action: 'create',
  resourceType: 'vm',
  specification: {},
  pseudoId: pseudoId1,
};
const item2: TicketItemRequestWithPseudoId = {
  action: 'create',
  resourceType: 'other',
  specification: {},
  pseudoId: pseudoId2,
};

describe('initial ticket', () => {
  it('initial ticket with application on blank state', () => {
    const init = actions.initialTicketWithApplication(app, []);
    const state = reducer({ ticket: null, resources: [] }, init);

    expect(state.ticket!.application).toEqual(app.id);
    expect(state.ticket!.approvers).toBeNull();
    expect(state.ticket!.items).toEqual([]);

    expect(state.resources).toEqual([]);
  });

  it('initial ticket with application on non blank state', () => {
    const newApp = { ...app, id: 2 };
    const init = actions.initialTicketWithApplication(newApp, []);
    const priorState: TicketWizardState = {
      ticket: ticket,
      resources: [],
    };
    const state = reducer(priorState, init);

    expect(state.ticket!.application).toEqual(newApp.id);
    expect(state.ticket!.approvers).toBeNull();
    expect(state.ticket!.items).toEqual([]);
  });

  it('initial ticket with existing ticket', () => {
    const ticket: TicketResponse = {
      id: 5,
      ticketNo: '0001',
      application: app,
      project: app.project,
      dataCenter: { id: 1, name: 'data center' },
      noteFromOperator: null,
      jobCode: '987654321',
      status: 'created',
      createdAt: '',
      createdBy: { id: 1, username: 'hello', fullname: 'hello' },
      updatedAt: '',
      updatedBy: { id: 1, username: 'hello', fullname: 'hello' },
      items: [
        { id: 1, action: 'created', resourceType: 'vm', specification: {} },
        {
          id: 2,
          action: 'delete',
          resourceType: 'vm',
          resource: {
            id: 3,
            name: 'vm1',
            secondaryName: 'vm1',
            dataCenter: { id: 1, name: 'data center' },
            jobCode: '987654321',
            details: {},
            resourceType: 'vm',
            activeFlag: true,
          },
          specification: {},
        },
      ],
    };

    const approvement: ApprovementBriefProperty[] = [
      {
        id: 20,
        ticket: ticket.id,
        ticketNo: ticket.ticketNo,
        ticketStatus: 'created',
        approver: { id: 22, fullname: 'fname', username: 'uname', firstName: '', lastName: '', email: '', groups: [] },
        approverId: 222,
        approverLevel: 1,
        applicationName: app.name,
        projectName: app.project.name,
        requestedAt: '',
      },
    ];

    const init = initialTicketWithExisting(ticket, approvement, []);
    const state = reducer({ ticket: null, resources: [] }, init);

    expect(state.ticket!.application).toEqual(ticket.application.id);
    expect(state.ticket!.dataCenter).toEqual(ticket.dataCenter);
    expect(state.ticket!.jobCode).toEqual(ticket.jobCode);

    expect(state.ticket!.items).toEqual([
      { id: 1, action: 'created', resourceType: 'vm', specification: {}, pseudoId: 1 },
      { id: 2, action: 'delete', resourceType: 'vm', resource: 3, specification: {}, pseudoId: 2 },
    ]);

    expect(state.ticket!.approvers).toEqual([{ id: 222, level: 1, user: approvement[0].approver }]);
    expect(state.ticket!.items).toContainEqual(
      expect.objectContaining({
        pseudoId: expect.any(Number),
      }),
    );
  });
});

describe('items', () => {
  const priorState = reducer({ ticket: null, resources: [] }, actions.initialTicketWithApplication(app, []));

  it('add item, should add one more item on empty list', () => {
    const state = reducer(priorState, actions.addItem(item1));

    expect(state.ticket!.items).toEqual([item1]);
    expect(state.ticket!.application).toEqual(app.id);
  });

  it('add item, should add one more item on non-empty list', () => {
    const itemOneState = reducer(priorState, actions.addItem(item1));
    const itemTwoState = reducer(itemOneState, actions.addItem(item2));

    expect(itemTwoState.ticket!.items).toEqual([item1, item2]);
    expect(itemTwoState.ticket!.application).toEqual(app.id);
  });

  it('remove an item, of the last item', () => {
    const itemOneState = reducer(priorState, actions.addItem(item1));
    const removedState = reducer(itemOneState, actions.removeItem(pseudoId1));

    expect(removedState.ticket!.items).toEqual([]);
  });

  it('remove an item, of more than one time', () => {
    const itemOneState = reducer(priorState, actions.addItem(item1));
    const itemTwoState = reducer(itemOneState, actions.addItem(item2));
    const removedState = reducer(itemTwoState, actions.removeItem(pseudoId1));

    expect(removedState.ticket!.items).toEqual([item2]);
  });

  it('remove an item, of unknown index', () => {
    const itemOneState = reducer(priorState, actions.addItem(item1));
    const itemTwoState = reducer(itemOneState, actions.addItem(item2));
    const removedState = reducer(itemTwoState, actions.removeItem(2));

    expect(removedState.ticket).toEqual(itemTwoState.ticket);
  });

  it('edit an item, should replace the item', () => {
    const itemOneState = reducer(priorState, actions.addItem(item1));
    const itemTwoState = reducer(itemOneState, actions.addItem(item2));
    const removedState = reducer(itemTwoState, actions.editItem(pseudoId2, { ...item2, resourceType: 'container' }));

    expect(removedState.ticket!.items[1].resourceType).toEqual('container');
  });
});

describe('assign approver', () => {
  it('assign approver on active ticket state', () => {
    const approvers: ApproverProperty[] = [
      {
        level: 1,
        id: 5,
        user: {
          id: 5,
          username: 'approver005',
          fullname: 'approver 555',
          firstName: 'approver',
          lastName: '555',
          email: '555@approver.com',
          groups: [],
        },
      },
    ];
    const state = reducer({ ticket: ticket, resources: [] }, actions.assignApprover(approvers));

    expect(state.ticket!.approvers![0].id).toEqual(5);
    expect(state.ticket!.application).toEqual(ticket.application);
    expect(state.ticket!.items).toEqual(ticket.items);
  });

  it('assign approver on blank state', () => {
    const approvers: ApproverProperty[] = [
      {
        level: 1,
        id: 5,
        user: {
          id: 5,
          username: 'approver005',
          fullname: 'approver 555',
          firstName: 'approver',
          lastName: '555',
          email: '555@approver.com',
          groups: [],
        },
      },
    ];
    const state = reducer({ ticket: null, resources: [] }, actions.assignApprover(approvers));

    expect(state.ticket).toBeNull();
  });
});

describe('set dataCenter', () => {
  const originalTicket: TicketWizardProperty = {
    ...ticket,
    items: [
      {
        pseudoId: 1,
        action: 'update',
        resourceType: RESOURCE_TYPE_CONTAINER,
        resource: 1,
        specification: {},
      },
      {
        pseudoId: 2,
        action: 'dismiss',
        resourceType: RESOURCE_TYPE_CONTAINER,
        resource: 2,
        specification: {},
      },
      {
        pseudoId: 3,
        action: 'create',
        resourceType: RESOURCE_TYPE_CONTAINER,
        specification: {},
      },
    ],
  };

  const resources: ResourceProperty[] = [
    {
      id: 1,
      name: 'paas 1',
      secondaryName: 'paas 1',
      resourceType: RESOURCE_TYPE_CONTAINER,
      details: {},
      dataCenter: { id: 1, name: 'dc1' },
      jobCode: '000001',
      activeFlag: true,
    },
    {
      id: 2,
      name: 'paas 2',
      secondaryName: 'paas 2',
      resourceType: RESOURCE_TYPE_CONTAINER,
      details: {},
      dataCenter: { id: 2, name: 'dc1' },
      jobCode: '000002',
      activeFlag: true,
    },
  ];

  it('assign dataCenter of blank ticket item', () => {
    const state = reducer(
      { ticket: ticket, resources: [] },
      actions.setDataCenter({ id: 1, name: 'data center' }, '000001'),
    );

    expect(state.ticket!.dataCenter!.name).toEqual('data center');
    expect(state.ticket!.jobCode).toEqual('000001');
    expect(state.ticket!.application).toEqual(ticket.application);
    expect(state.ticket!.items).toEqual(ticket.items);
  });

  it('assign dataCenter cause remove ticket items of other dataCenter and jobCode', () => {
    const state = reducer(
      { ticket: originalTicket, resources: resources },
      actions.setDataCenter({ id: 1, name: 'data center' }, '000001'),
    );

    expect(state.ticket!.dataCenter!.name).toEqual('data center');
    expect(state.ticket!.jobCode).toEqual('000001');

    expect(state.ticket!.items).not.toContainEqual(expect.objectContaining({ resource: 2 }));
    expect(state.ticket!.items).toHaveLength(2);
  });

  it('assign dataCenter cause remove ticket items of unavailable resource', () => {
    const originalTicket: TicketWizardProperty = {
      ...ticket,
      items: [
        {
          pseudoId: 1,
          action: 'create',
          resourceType: RESOURCE_TYPE_CONTAINER,
          specification: {},
        },
        {
          pseudoId: 2,
          action: 'create',
          resourceType: RESOURCE_TYPE_VM,
          specification: {},
        },
      ],
    };
    const state = reducer(
      { ticket: originalTicket, resources: resources },
      actions.setDataCenter({ id: 1, name: 'data center', availableResources: [RESOURCE_TYPE_VM] }, '000001'),
    );

    expect(state.ticket!.dataCenter!.name).toEqual('data center');
    expect(state.ticket!.jobCode).toEqual('000001');

    expect(state.ticket!.items).toContainEqual(expect.objectContaining({ resourceType: RESOURCE_TYPE_VM }));
    expect(state.ticket!.items).toHaveLength(1);
  });
});
