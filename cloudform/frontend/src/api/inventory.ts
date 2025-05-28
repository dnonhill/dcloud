import { Dispatch } from 'redux';

import { apiPromise } from './promise';
import { TicketItemProperty } from './ticket';

export interface ToatalPrice {
  value: number;
}

export interface PriceDetailSearchProperty {
  key: string;
  totalPrice: ToatalPrice;
}

export interface InvetorySearchProperty {
  startDate: Date;
  endDate: Date;
  name?: string;
  projectName?: string;
  dataCenter?: string;
  applicationName?: string;
  jobCode?: string;
}

export interface PriceDetailGraphResult {
  name: string;
  value: number;
  category?: string;
}

export interface PriceDetail {
  price_details: PriceDetailGraphResult[];
  categories: PriceDetailGraphResult[];
}

interface PowerStateDetail {
  hour: Date | string | null;
  index: number;
  value: number;
}

export interface PowerState {
  name: string;
  result: PowerStateDetail[];
}

export interface PricePerDayRequest {
  startDate: Date;
  endDate: Date;
}

export interface PricePerDayResponse {
  date: string;
  price: number;
}

export type PowerStateResponse = PowerState[];

export type PriceDetailGraphResponse = PriceDetail;

export type InvetoryRequest = InvetorySearchProperty;
export type PriceDetailSearchResponse = PriceDetailSearchProperty[];

const inventoryApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);
  return {
    getOptions: () => {
      return api<any>({
        url: 'inventory/option/',
        method: 'GET',
      });
    },
    priceDetail: (data: InvetoryRequest, params?: any) => {
      return api<PriceDetailGraphResponse>({
        url: 'inventory/search/price_detail/',
        method: 'POST',
        data,
        params,
      });
    },
    inventory: (data: InvetoryRequest, params?: any) => {
      return api<PriceDetailSearchResponse>({
        url: 'inventory/search/inventory/',
        method: 'POST',
        data,
        params,
      });
    },
    resourceDetails: (data: InvetoryRequest, params?: any) => {
      return api<TicketItemProperty[]>({
        url: 'inventory/search/resource_details/',
        method: 'POST',
        data,
        params,
      });
    },
    powerState: (data: InvetoryRequest) => {
      return api<PowerStateResponse>({
        url: 'inventory/search/power_state/',
        method: 'POST',
        data,
      });
    },
    allPriceAllDay: (data: PricePerDayRequest) => {
      return api<PricePerDayResponse[]>({
        url: 'inventory/search/all_price_per_day/',
        method: 'POST',
        data,
      });
    },
  };
};

export default inventoryApi;
