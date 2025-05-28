import { Dispatch } from 'redux';

import { apiPromise } from './promise';

interface InvoiceRequest {
  project?: string | null;
  application?: string | null;
  jobCode?: string | null;
  organizationId?: number;
  period: {
    month: string;
    year: string;
  };
  email: string;
}

type ServerDetail = {
  name: string;
  price: number;
  hrs: number;
  description: string;
};

type Server = {
  name: string;
  price: number;
  details: ServerDetail[];
};

type InvoiceResponse = {
  billFromAddress: string;
  billToAddress: string;
  criteriaType: string;
  periodFrom: string;
  periodTo: string;
  projectName: string;
  servers: Server[];
  summary: number;
  tenantCode: string;
};

const invoicesApi = (dispatch: Dispatch) => {
  const api = apiPromise(dispatch);
  return {
    downloadInvoice: (data: InvoiceRequest, params?: any) => {
      return api<InvoiceResponse>({
        url: 'invoices/',
        method: 'POST',
        data,
        params,
      });
    },
  };
};

export default invoicesApi;
