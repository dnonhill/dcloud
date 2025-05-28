import * as React from 'react';
import { HTMLAttributes } from 'react';

interface DividerProps {
  dataContent?: string;
}

export const Divider: React.FC<DividerProps> = (props) => (
  <div className="is-divider" data-content={props.dataContent} />
);

export const Timeline: React.FC = (props) => <div className="timeline">{props.children}</div>;

interface TimelineItemProps {
  isColor?: string;
}

export const TimelineItem: React.FC<TimelineItemProps> = (props) => (
  <div className={`timeline-item ${props.isColor ? props.isColor : ''}`}>{props.children}</div>
);

interface TimelineMarkerProps {
  isIcon?: boolean;
  isColor?: string;
}

export const TimelineMarker: React.FC<TimelineMarkerProps> = (props) => (
  <div className={`timeline-marker ${props.isIcon ? 'is-icon' : ''} ${props.isColor ? props.isColor : ''}`}>
    {props.children}
  </div>
);

export const TimelineHeader: React.FC<HTMLAttributes<HTMLDivElement>> = (props) => (
  <header {...props} className={`timeline-header ${props.className || ''}`} />
);

export const TimelineContent: React.FC<HTMLAttributes<HTMLDivElement>> = (props) => (
  <div {...props} className={`timeline-content ${props.className || ''}`}>
    {props.children}
  </div>
);

export const TimelineContentHeading: React.FC<HTMLAttributes<HTMLParagraphElement>> = (props) => (
  <p {...props} className={`heading ${props.className || ''}`}>
    {props.children}
  </p>
);
