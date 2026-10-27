import React from 'react';

// Updated styles according to the new color scheme
export const genericFunctionRendererStyles = {
  pre: {
    backgroundColor: '#1F1F1F',
    color: '#68CDFE', // Normal text (like object props) color
    padding: '10px', // Adding some padding for visual spacing
    borderRadius: '5px', // Optional: adds rounded corners to the <pre> tag
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word' as const,
  },
  functionName: { color: '#D0DC8B' }, // Function color
  stringValue: { color: '#CE834A' }, // String value color
  numberValue: { color: '#B5C078' }, // Number value color
  undefinedValue: { color: '#4A9CB3' }, // Number value color
  booleanValue: { color: '#4A9CB3' }, // Number value color
  emptyObject: { color: 'grey' }, // Number value color
  arrayItems: { color: 'white' }, // Number value color
  commentBlock: { color: '#5E993E', paddingBottom: 10 }, // Number value color
  highlightComment: { color: 'white' }, // Number value color
  jsonComment: { color: '#5E993E' }, // Number value color
};

type VariableViewProps = {
  value: any;
  expanded: boolean;
  hideStringQuotes?: boolean;
};

// Try to parse a string as JSON. We reject bare numbers so that plain numeric
// strings (which JSON.parse happily accepts) keep rendering as strings.
const tryParseJson = (text: string): { ok: true; value: any } | { ok: false } => {
  try {
    const value = JSON.parse(text);
    if (typeof value === 'number') {
      return { ok: false };
    }
    return { ok: true, value };
  } catch {
    return { ok: false };
  }
};

// base64 decoding succeeds on plenty of random strings, so the JSON parse below
// is what actually makes this specific - it only matches if the string is BOTH
// valid base64 AND decodes to valid JSON.
const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;

const tryDecodeBase64 = (text: string): string | undefined => {
  // Cheap structural gate: canonical base64 uses only this charset and its length
  // is a multiple of 4. This also skips obvious non-base64 (anything with {, ", spaces).
  if (text.length === 0 || text.length % 4 !== 0 || !base64Pattern.test(text)) {
    return undefined;
  }

  try {
    const decoded = atob(text);
    // Round-trip to reject non-canonical base64 that atob would otherwise accept.
    if (btoa(decoded) !== text) {
      return undefined;
    }
    return decoded;
  } catch {
    return undefined;
  }
};

export const StringVariableView = ({ value, expanded, hideStringQuotes }: VariableViewProps) => {
  const asJson = tryParseJson(value);
  if (asJson.ok) {
    return (
      <>
        <span style={genericFunctionRendererStyles.jsonComment}>
          {'<'}json{'>'}
        </span>
        <AnyVariableView expanded={expanded} value={asJson.value} />
      </>
    );
  }

  const decoded = tryDecodeBase64(value);
  if (decoded !== undefined) {
    const asBase64Json = tryParseJson(decoded);
    if (asBase64Json.ok) {
      return (
        <>
          <span style={genericFunctionRendererStyles.jsonComment}>
            {'<'}base64-json{'>'}
          </span>
          <AnyVariableView expanded={expanded} value={asBase64Json.value} />
        </>
      );
    }
  }

  const trimmedValue = value.length > 25 && !expanded ? `${value.slice(0, 25)}...` : value;

  if (hideStringQuotes) {
    return <span style={genericFunctionRendererStyles.stringValue}>{trimmedValue}</span>;
  }

  return <span style={genericFunctionRendererStyles.stringValue}>&quot;{trimmedValue}&quot;</span>;
};

export const ArrayVariableView = ({ value, expanded }: VariableViewProps) => {
  if (value.length == 0) {
    return !expanded ? (
      <>
        <span>[</span>
        <span style={genericFunctionRendererStyles.emptyObject}>Empty Array</span>
        <span>]</span>
      </>
    ) : (
      <>[]</>
    );
  }

  if (expanded) {
    return (
      <>
        <span>[</span>
        <div style={{ paddingLeft: 10 }}>
          {value.map((item: any, index: number) => (
            <div key={index}>
              <AnyVariableView expanded={expanded} value={item} />,
            </div>
          ))}
        </div>
        <span>]</span>
      </>
    );
  }

  return (
    <>
      <span>[ </span>
      <span style={genericFunctionRendererStyles.arrayItems}>{value.length} items</span>
      <span> ]</span>
    </>
  );
};

export const KvsQueryConditionVariableView = ({ value, expanded }: VariableViewProps) => {
  return <GenericFunctionRenderer args={[value.key, value.valueA]} expanded={expanded} functionName={`kvs${value.operation}`} />;
};

export const KvsLogicalOperatorVariableView = ({ value, expanded }: VariableViewProps) => {
  return <GenericFunctionRenderer args={[value.conditions]} expanded={expanded} functionName={`kvs${value.operation}`} />;
};

export const EmptyObjectVariableView = ({ value, expanded }: VariableViewProps) => {
  return !expanded ? (
    <>
      <span>{'{ '}</span>
      <span style={genericFunctionRendererStyles.emptyObject}>Empty Object</span>
      <span>{' }'}</span>
    </>
  ) : (
    <>{`{ }`}</>
  );
};

export const QpqBinaryDataVariableView = ({ value, expanded }: VariableViewProps) => {
  return (
    <img alt="Binary Data" src={`data:${value.mimeType || 'image/jpeg'};base64,${value.base64Data}`} style={{ width: '100px', height: 'auto' }} />
  );
};

export const ObjectVariableView = ({ value, expanded }: VariableViewProps) => {
  if (Array.isArray(value)) {
    return <ArrayVariableView expanded={expanded} value={value} />;
  }

  const objectKeys = Object.keys(value);

  if (value.operation && value.key && objectKeys.length <= 4) {
    return <KvsQueryConditionVariableView expanded={expanded} value={value} />;
  } else if (value.operation && value.conditions && objectKeys.length == 2) {
    return <KvsLogicalOperatorVariableView expanded={expanded} value={value} />;
  } else if (objectKeys.length == 0) {
    return <EmptyObjectVariableView expanded={expanded} value={value} />;
  } else if (value.base64Data && value.filename) {
    return <QpqBinaryDataVariableView expanded={expanded} value={value} />;
  }

  const cleanObject = JSON.parse(JSON.stringify(value));
  const cleanObjectKeys = Object.keys(cleanObject);

  return !expanded ? (
    <>
      <span>{'{ '}</span>
      {/* {objectKeysWithArrayCounts.join(', ')} */}
      {cleanObjectKeys.map((key, index) => (
        <span key={key}>
          {key}
          {Array.isArray(cleanObject[key]) && !expanded && (
            <>
              <span>:</span> <ArrayVariableView expanded={false} value={cleanObject[key]} />
            </>
          )}
          {index < cleanObjectKeys.length - 1 && ', '}
        </span>
      ))}
      <span>{' }'}</span>
    </>
  ) : (
    <>
      <span>{'{ '}</span>
      <div style={{ paddingLeft: 10 }}>
        {cleanObjectKeys.map((key, index) => (
          <div key={key}>
            {key}: <AnyVariableView expanded={expanded} value={cleanObject[key]} />,
          </div>
        ))}
      </div>
      <span>{'}'}</span>
    </>
  );
};

// Helper function to style values based on their type
export const AnyVariableView = ({ value, expanded, hideStringQuotes }: VariableViewProps) => {
  if (value === undefined) {
    return <span style={genericFunctionRendererStyles.undefinedValue}>undefined</span>;
  } else if (value === null) {
    return <span style={genericFunctionRendererStyles.undefinedValue}>null</span>;
  } else if (typeof value === 'boolean') {
    return <span style={genericFunctionRendererStyles.booleanValue}>{value.toString()}</span>;
  } else if (typeof value === 'number') {
    return <span style={genericFunctionRendererStyles.numberValue}>{value}</span>;
  } else if (typeof value === 'string') {
    return <StringVariableView expanded={expanded} hideStringQuotes={hideStringQuotes} value={value} />;
  } else if (typeof value === 'object') {
    return <ObjectVariableView expanded={expanded} value={value} />;
  }

  // Fallback for other types, using normal text color
  return <span>{value.toString()}</span>;
};

interface GenericFunctionRendererProps {
  functionName: string;
  args: { [key: string]: any }; // Object containing argument names and their values
  tooltipMap?: string[]; // Optional tooltips corresponding to args
  argRenderer?: (arg: string, value: any) => JSX.Element;
  expanded: boolean;
}

const renderBasicArg = (arg: string, value: any, index: number, expanded: boolean, tooltip?: string): JSX.Element => {
  const tooltipText = `${tooltip || arg}\n\nvalue: ${JSON.stringify(value, null, 2)}`;

  return (
    <React.Fragment key={arg}>
      <span title={tooltipText}>
        <AnyVariableView expanded={expanded} value={value} />
      </span>
    </React.Fragment>
  );
};

export const GenericFunctionRenderer: React.FC<GenericFunctionRendererProps> = ({
  functionName,
  args,
  expanded,
  tooltipMap = [],
  argRenderer = renderBasicArg,
}) => {
  // Convert args object to an array of key-value pairs and map each to a span element with dynamic styling and optional tooltip
  const argEntries = Object.entries(args);
  const argsWithTooltips = argEntries.map(([arg, value], index) => (
    <React.Fragment key={index}>
      {argRenderer(arg, value, index, expanded, tooltipMap[index])}
      {index < argEntries.length ? ', ' : ''}
      <br />
    </React.Fragment>
  ));

  return (
    <>
      <span style={genericFunctionRendererStyles.functionName}>{functionName}</span>
      {argEntries.length > 0 && (
        <>
          (<div style={{ paddingLeft: 15 }}>{argsWithTooltips}</div>)
        </>
      )}
      {argEntries.length == 0 && <>()</>}
    </>
  );
};
