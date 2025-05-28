import * as React from 'react';

import { AuditProperty } from '../api/audit';
import { displayDateTime } from '../formatter/date';

type LastUpdateProps<T extends AuditProperty> = {
  model: T;
};

export function LastUpdate<T extends AuditProperty>(props: LastUpdateProps<T>) {
  const { model } = props;
  return (
    <p className="has-text-grey is-size-7 has-text-right" style={{ marginTop: '-1rem', marginBottom: '1rem' }}>
      Last update by {model.updatedBy.username} @{displayDateTime(model.updatedAt)}
    </p>
  );
}
