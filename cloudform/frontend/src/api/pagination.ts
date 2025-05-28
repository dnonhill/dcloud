export interface PaginationParams {
  limit: number;
  offset: number;
}

export type PaginatedResponse<T> = {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
};
