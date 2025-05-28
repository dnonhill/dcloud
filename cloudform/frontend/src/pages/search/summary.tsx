import React from 'react';

import { PaginatedResponse } from '../../api/pagination';

export const SearchSummary: React.FC<PaginatedResponse<any>> = ({ count, results }) => {
  if (count) {
    return (
      <p style={{ marginBottom: '0.5rem' }} className="is-size-7">
        Showing {results.length} {results.length === 1 ? 'record' : 'records'}
        {results.length !== count && (
          <span>
            &nbsp;(from {count} {count === 1 ? 'record.' : 'records.'})
          </span>
        )}
      </p>
    );
  } else {
    return null;
  }
};
