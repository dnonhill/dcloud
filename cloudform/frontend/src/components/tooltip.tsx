import { Dropdown, DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from 'bloomer';
import * as React from 'react';

export const Tooltip: React.FC<{ text: string; tooltipText: string }> = ({ text, tooltipText }) => {
  return (
    <Dropdown isHoverable style={{ verticalAlign: 'baseline' }}>
      <DropdownTrigger>
        <p className="has-text-primary">{text}</p>
      </DropdownTrigger>
      {tooltipText !== '' && (
        <DropdownMenu>
          <DropdownContent>
            <DropdownItem>
              <p style={{ whiteSpace: 'nowrap' }}>{tooltipText}</p>
            </DropdownItem>
          </DropdownContent>
        </DropdownMenu>
      )}
    </Dropdown>
  );
};
