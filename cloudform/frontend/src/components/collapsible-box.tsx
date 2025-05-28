import { Icon } from 'bloomer';
import * as React from 'react';
import { useEffect } from 'react';

export interface CollapsibleBoxHeaderProps {
  isOpen: boolean;
}

interface CollapsibleBox {
  headerType: (props: CollapsibleBoxHeaderProps) => JSX.Element;
  isOpen?: boolean;
}

export const CollapsibleBox: React.FC<CollapsibleBox> = (props) => {
  const { headerType: HeaderType, isOpen } = props;
  const [showContent, setShowContent] = React.useState(false);

  const toggleShowContent = () => setShowContent(!showContent);

  useEffect(() => {
    setShowContent(isOpen || false);
  }, [isOpen]);

  return (
    <>
      <section onClick={() => toggleShowContent()} style={{ cursor: 'pointer' }}>
        <HeaderType isOpen={showContent} />
      </section>
      <section>{showContent && props.children}</section>
    </>
  );
};

export const CollapsibleIcon: React.FC<CollapsibleBoxHeaderProps> = (props) => (
  <Icon className={`fas fa-angle-${props.isOpen ? 'up' : 'down'}`} data-action="toggle-box" />
);
