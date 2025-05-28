import { Dropdown, DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger, Icon } from 'bloomer';
import * as React from 'react';

export const UserTooltip: React.FC<{ user: any; dataField: string }> = ({ user, dataField }) => {
  return (
    <Dropdown isHoverable>
      <DropdownTrigger>
        <p data-field={dataField} data-value={user.id} className="has-text-primary">
          {user.fullname || user.username}
          <Icon className="far fa-address-book" />
        </p>
      </DropdownTrigger>
      <DropdownMenu>
        <DropdownContent>
          <DropdownItem style={{ textAlign: 'left' }}>
            <p style={{ whiteSpace: 'nowrap' }}>
              <Icon className="far fa-envelope" />
              {user.email}
            </p>
            <p style={{ whiteSpace: 'nowrap' }}>
              <Icon className="far fa-building" />
              {user.department || '-'}
            </p>
            <p style={{ whiteSpace: 'nowrap' }}>
              <Icon className="fas fa-sitemap" />
              {user.organization || '-'}
            </p>
            <p style={{ whiteSpace: 'nowrap' }}>
              <Icon className="fas fa-mobile" />
              {user.mobile || '-'}
            </p>
          </DropdownItem>
        </DropdownContent>
      </DropdownMenu>
    </Dropdown>
  );
};
