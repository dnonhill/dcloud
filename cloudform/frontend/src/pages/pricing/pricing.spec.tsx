import { act, cleanup, fireEvent, render } from '@testing-library/react';
import * as React from 'react';

import { TicketItemProperty } from '../../api/ticket';
import { toMonthlyPrice } from '../../formatter/number';
import { TotalPricePanel, TotalPricePanelProps } from './pricing';

const items: TicketItemProperty[] = [
  {
    action: '',
    resourceType: 'vm',
    specification: {
      name: 'Test VM 1',
      cpu: 1,
      memory: 2,
      storageTier: '1_bronze',
      displayStorageTier: 'Normal - General purpose',
      osDisk: 50,
      os: 'Centos7',
      osType: 'linux',
      displayOs: 'CentOS 7',
      protectionLevel: 'p4',
      displayProtectionLevel: 'P4 - Backup Daily, No DR',
      environment: 'Development / PoC',
      displayEnvironment: 'Development / PoC',
      networkZone: 'database',
      displayNetworkZone: 'No internet connection (Database/Internal Zone)',
      database: null,
      webserver: null,
      distro: 'centos',
    },
    // pseudoId: 1599799343724,
    estimatedPrice: 299.6908,
    priceDetail: [
      {
        name: 'Hardware',
        total: 41.97,
        items: [
          {
            price: 23.328,
            hour: 2,
            display: 'Memory',
          },
          {
            price: 17.412,
            hour: 1,
            display: 'vCPU',
          },
          {
            price: 1.23,
            hour: 50,
            display: 'Disk - Bronze P4',
          },
        ],
      },
      {
        name: 'Software',
        total: 7.7208,
        items: [
          {
            price: 7.7208,
            hour: 1,
            display: 'Antivirus',
          },
        ],
      },
      {
        name: 'Default',
        total: 250,
        items: [
          {
            price: 250,
            hour: 1,
            display: 'Managed Services 24/7',
          },
        ],
      },
    ],
  },
  {
    action: '',
    resourceType: 'vm',
    specification: {
      name: 'Test VM 2',
      cpu: 32,
      memory: 388,
      storageTier: '3_gold',
      displayStorageTier: 'High speed - High traffic database',
      osDisk: 50,
      os: 'Centos7',
      osType: 'linux',
      displayOs: 'CentOS 7',
      protectionLevel: 'p4',
      displayProtectionLevel: 'P4 - Backup Daily, No DR',
      environment: 'Development / PoC',
      displayEnvironment: 'Development / PoC',
      networkZone: 'database',
      displayNetworkZone: 'No internet connection (Database/Internal Zone)',
      database: null,
      webserver: null,
      distro: 'centos',
    },
    // pseudoId: 1599799364153,
    estimatedPrice: 5349.1618,
    priceDetail: [
      {
        name: 'Hardware',
        total: 5091.441,
        items: [
          {
            price: 4525.632,
            hour: 388,
            display: 'Memory',
          },
          {
            price: 557.184,
            hour: 32,
            display: 'vCPU',
          },
          {
            price: 8.625,
            hour: 50,
            display: 'Disk - Gold P4',
          },
        ],
      },
      {
        name: 'Software',
        total: 7.7208,
        items: [
          {
            price: 7.7208,
            hour: 1,
            display: 'Antivirus',
          },
        ],
      },
      {
        name: 'Default',
        total: 250,
        items: [
          {
            price: 250,
            hour: 1,
            display: 'Managed Services 24/7',
          },
        ],
      },
    ],
  },
];

describe('PriceDetail', () => {
  function createElement(props: TotalPricePanelProps) {
    return render(<TotalPricePanel items={props.items} />);
  }

  it('render correct total estimated price on header', () => {
    const { queryByTestId } = createElement({ items });
    const priceHeader = queryByTestId('price-detail-header');

    expect(priceHeader?.textContent).toContain('Total Estimated Price 4,067,173.87 THB/Month');
  });

  it('render all individual item inside items', async () => {
    const { queryByTestId, queryAllByTestId } = createElement({ items });

    const expandAllBtn = queryByTestId('total-price-expand-all');
    expect(expandAllBtn).not.toBeNull();

    await act(async () => {
      expandAllBtn && fireEvent.click(expandAllBtn);
    });

    const priceContents = queryAllByTestId('price-detail-content');
    priceContents.forEach((priceContent, index) => {
      expect(priceContent.textContent).toContain(toMonthlyPrice(items[index].estimatedPrice));
    });

    expect(priceContents.length).toEqual(2);
  });
});

afterEach(cleanup);
