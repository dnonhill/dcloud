import _ from 'lodash';
import React from 'react';

export interface PaginationOption {
  currentPage: number;
  itemPerPage: number;
}

export const DEFAULT_PAGINATION: PaginationOption = {
  currentPage: 0,
  itemPerPage: 10,
};

export type ParamsObject = { [key: string]: string | number | boolean };

function buildPaginationParams(paginate?: PaginationOption): ParamsObject | undefined {
  if (paginate) {
    return {
      limit: paginate.itemPerPage,
      offset: paginate.currentPage * paginate.itemPerPage,
    };
  }
}

export type OrderDirection = 'ASC' | 'DSC';

export interface OrderOption {
  field: string;
  direction: OrderDirection;
}

function buildOrderParams(order?: OrderOption): ParamsObject | undefined {
  if (order) {
    const ordering = order.direction === 'ASC' ? order.field : `-${order.field}`;
    return { ordering };
  }
}

export interface SearchOption {
  field: string;
  value: string;
}

function buildSearchParams(search?: SearchOption[]): ParamsObject | undefined {
  if (search) {
    return search.reduce((prev, curr) => ({ ...prev, [curr.field]: curr.value }), {});
  }
}

export function buildListingParams(paginate?: PaginationOption, order?: OrderOption, search?: SearchOption[]) {
  const params = {
    ...buildPaginationParams(paginate),
    ...buildOrderParams(order),
    ...buildSearchParams(search),
  };
  return params;
}

// Reimplement buildListingParams

type FilterOption = any;

// state
export interface QueryOptions {
  paginate: PaginationOption;
  order?: OrderOption;
  filter: FilterOption;
}

export const DEFAULT_QUERY_OPTIONS = {
  paginate: DEFAULT_PAGINATION,
  filter: {},
};

export const DEFAULT_ADMIN_QUERY_OPTIONS = {
  paginate: DEFAULT_PAGINATION,
  filter: { all: true },
};

// action
const SET_PAGINATION = 'SET_PAGINATION';
const SET_QUERY_ORDERING = 'SET_QUERY_ORDERING';
const SET_QUERY_FILTER = 'SET_QUERY_FILTER';
const UPDATE_QUERY_FILTER = 'UPDATE_QUERY_FILTER';

interface SetQueryPaginationAction {
  type: typeof SET_PAGINATION;
  payload: PaginationOption;
}

interface SetQueryOrderingAction {
  type: typeof SET_QUERY_ORDERING;
  payload: OrderOption;
}

interface SetQueryFilterAction {
  type: typeof SET_QUERY_FILTER;
  payload: FilterOption;
}

interface UpdateQueryFilterAction {
  type: typeof UPDATE_QUERY_FILTER;
  payload: FilterOption;
}

type ApiParamsAction =
  | SetQueryPaginationAction
  | SetQueryOrderingAction
  | SetQueryFilterAction
  | UpdateQueryFilterAction;

// creator
export const setQueryPagination = (payload: PaginationOption): ApiParamsAction => ({
  type: SET_PAGINATION,
  payload,
});
export const setQueryOrdering = (payload: OrderOption): ApiParamsAction => ({
  type: SET_QUERY_ORDERING,
  payload,
});
export const setQueryFilter = (payload: FilterOption): ApiParamsAction => ({
  type: SET_QUERY_FILTER,
  payload,
});
export const updateQueryFilter = (payload: FilterOption): ApiParamsAction => ({
  type: UPDATE_QUERY_FILTER,
  payload,
});

// reducer
export function useQueryOptions(initialSettings: QueryOptions = DEFAULT_QUERY_OPTIONS) {
  const { paginate: defaultPaginate = DEFAULT_PAGINATION } = initialSettings;

  const apiParamsReducer: React.Reducer<QueryOptions, ApiParamsAction> = (state = DEFAULT_QUERY_OPTIONS, action) => {
    switch (action.type) {
      case SET_PAGINATION:
        if (_.isEqual(state.paginate, action.payload)) return state;

        return {
          ...state,
          paginate: action.payload,
        };

      case SET_QUERY_ORDERING:
        if (_.isEqual(state.order, action.payload)) return state;

        return {
          ...state,
          order: action.payload,
          paginate: defaultPaginate,
        };

      case SET_QUERY_FILTER:
        if (_.isEqual(state.filter, action.payload)) return state;

        return {
          ...state,
          filter: action.payload,
          paginate: defaultPaginate,
        };

      case UPDATE_QUERY_FILTER:
        const newFilter = { ...state.filter, ...action.payload };
        if (_.isEqual(state.filter, newFilter)) return state;

        return {
          ...state,
          filter: newFilter,
          paginate: defaultPaginate,
        };

      default:
        return state;
    }
  };

  const [queryOptions, dispatchQuery] = React.useReducer(apiParamsReducer, initialSettings);
  const queryParams = React.useMemo(
    () => ({
      ...buildPaginationParams(queryOptions.paginate),
      ...buildOrderParams(queryOptions.order),
      ...queryOptions.filter,
    }),
    [queryOptions],
  );

  return {
    queryOptions,
    dispatchQuery,
    queryParams,
    setPaginationOption: (params: PaginationOption) => dispatchQuery(setQueryPagination(params)),
  };
}
