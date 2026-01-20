import { useState, ReactNode } from 'react';
import './CollapsibleSection.css';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

export function CollapsibleSection({
  title,
  children,
  defaultExpanded = true,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`collapsible-section ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button
        className="collapsible-header"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <span className="collapsible-title">{title}</span>
        <span className="collapsible-icon">{isExpanded ? '−' : '+'}</span>
      </button>
      <div className="collapsible-content">
        {children}
      </div>
    </div>
  );
}
