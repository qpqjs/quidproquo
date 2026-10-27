import { QpqExecutionTraceValue } from 'quidproquo-core';

import React, { useMemo } from 'react';

// Expandable rendering of one captured local. Values with a deep json capture render as
// a collapsible tree (native <details>, so state survives without bookkeeping); values
// without one fall back to their preview string.

interface LocalValueTreeProps {
  name: string;
  value: QpqExecutionTraceValue;
}

const primitiveStyle: React.CSSProperties = { color: 'rgba(70, 140, 200, 1)' };
const markerStyle: React.CSSProperties = { color: 'rgba(150, 150, 150, 1)', fontStyle: 'italic' };
const nameStyle: React.CSSProperties = { fontWeight: 600 };
const branchStyle: React.CSSProperties = { paddingLeft: 20 };

// Capture-time placeholders («circular», «function fn», «+3 more», …) come through as
// strings — render them dim/italic so they read as markers, not data.
const isMarkerString = (value: string): boolean => value.startsWith('«') && value.endsWith('»');

const renderPrimitive = (value: unknown): React.ReactNode => {
  if (typeof value === 'string') {
    return isMarkerString(value) ? <span style={markerStyle}>{value.slice(1, -1)}</span> : <span style={primitiveStyle}>{`'${value}'`}</span>;
  }
  return <span style={primitiveStyle}>{String(value)}</span>;
};

const RenderNode: React.FC<{ label: string; node: unknown }> = ({ label, node }) => {
  if (node === null || typeof node !== 'object') {
    return (
      <div style={branchStyle}>
        <span style={nameStyle}>{label}</span>: {renderPrimitive(node)}
      </div>
    );
  }

  const isArray = Array.isArray(node);
  const entries = Object.entries(node as Record<string, unknown>);
  const summary = isArray ? `[${entries.length}]` : `{${entries.length}}`;

  return (
    <details style={branchStyle}>
      <summary style={{ cursor: 'pointer' }}>
        <span style={nameStyle}>{label}</span> <span style={markerStyle}>{summary}</span>
      </summary>
      {entries.map(([key, child]) => (
        <RenderNode key={key} label={key} node={child} />
      ))}
    </details>
  );
};

export const LocalValueTree: React.FC<LocalValueTreeProps> = ({ name, value }) => {
  const parsed = useMemo(() => {
    if (!value.json) {
      return undefined;
    }
    try {
      return JSON.parse(value.json);
    } catch {
      return undefined;
    }
  }, [value.json]);

  if (parsed === undefined || parsed === null || typeof parsed !== 'object') {
    return (
      <div>
        <span style={nameStyle}>{name}</span> = {value.preview}
      </div>
    );
  }

  return (
    <details>
      <summary style={{ cursor: 'pointer' }}>
        <span style={nameStyle}>{name}</span> = {value.preview}
      </summary>
      {Object.entries(parsed as Record<string, unknown>).map(([key, child]) => (
        <RenderNode key={key} label={key} node={child} />
      ))}
    </details>
  );
};
