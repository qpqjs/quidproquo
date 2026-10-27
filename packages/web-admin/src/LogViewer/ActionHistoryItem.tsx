import { Action } from 'quidproquo-core';

import TruncatedText from './TruncatedText';

interface ActionHistoryItemProps {
  action: Action<any>;
  result: any;
  expanded: boolean;
}

export const ActionHistoryItem = ({ action, result, expanded }: ActionHistoryItemProps) => {
  const inputText = JSON.stringify(action.payload, null, 2);
  const outputText = JSON.stringify(result, null, 2);

  return (
    <>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        <TruncatedText expanded={expanded} text={inputText} title="Input" />
      </pre>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        <TruncatedText expanded={expanded} text={outputText} title="Output" />
      </pre>
    </>
  );
};
