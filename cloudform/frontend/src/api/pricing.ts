import { Dispatch } from 'redux';

import { apiPromise } from './promise';

export interface CalculatePriceResponse {
  price: number;
  priceDetail: Array<PricingDetail>;
}

export interface PricingDetail {
  name: string;
  total: number;
  items: Array<PriceItemDetail>;
}

export interface PriceItemDetail {
  price: number;
  hour: number;
  display: string;
}

export interface CalculatePriceProperty {
  resourceType: string;
  specification: any;
}

export type CalculatePriceRequest = CalculatePriceProperty;

const pricingApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);
  return {
    calculate: (data: CalculatePriceRequest) => {
      return api<CalculatePriceResponse>({
        url: '/pricing/calculate/',
        method: 'GET',
        params: data,
      });
    },
  };
};

export default pricingApi;
