import { TicketRequest } from '../../../api/ticket';
import { TicketWizardProperty } from '../../../redux/ticket-wizard';
import { convertStateToRequest } from './state-to-service';

describe('StateToService', () => {
  describe('convertStateToRequest', () => {
    it('state contains not null', () => {
      const state: TicketWizardProperty = {
        application: 1,
        dataCenter: {
          id: 2,
          name: 'Data center',
        },
        jobCode: 'job code',
        items: [
          {
            pseudoId: 1,
            action: 'create',
            resourceType: 'vm',
            specification: { name: 'hello' },
          },
        ],
        approvers: [
          {
            level: 1,
            id: 3,
            user: {
              username: 'Approver',
              fullname: 'Approver full',
              firstName: 'Approver',
              lastName: '',
              email: '',
              groups: [{ id: 1, name: 'requestor' }],
            },
          },
        ],
      };

      const actual = convertStateToRequest(state);
      const expected: TicketRequest = {
        application: 1,
        dataCenter: 2,
        jobCode: 'job code',
        items: [
          {
            action: 'create',
            resourceType: 'vm',
            specification: { name: 'hello', memoryMb: undefined },
          },
        ],
        approvers: [3],
      };

      expect(actual).toEqual(expected);
    });

    it('convert fields as necessary', () => {
      const state: TicketWizardProperty = {
        application: 1,
        dataCenter: {
          id: 2,
          name: 'Data center',
        },
        jobCode: 'job code',
        items: [
          {
            pseudoId: 1,
            action: 'create',
            resourceType: 'vm',
            specification: {
              name: 'hello',
              memory: 3,
            },
          },
        ],
        approvers: [
          {
            level: 1,
            id: 3,
            user: {
              username: 'Approver',
              fullname: 'Approver full',
              firstName: 'Approver',
              lastName: '',
              email: '',
              groups: [{ id: 1, name: 'requestor' }],
            },
          },
        ],
      };

      const actual = convertStateToRequest(state);
      expect(actual!.items[0].specification.memoryMb).toEqual(3 * 1024);
    });
  });

  it('state is invalid', () => {
    const state = {
      application: 1,
      dataCenter: null,
      jobCode: 'job code',
      items: [
        {
          pseudoId: 1,
          action: 'create',
          resourceType: 'vm',
          specification: { name: 'hello' },
        },
      ],
      resources: [],
      approvers: null,
    };

    const actual = convertStateToRequest(state);
    expect(actual).toBeNull();
  });
});
