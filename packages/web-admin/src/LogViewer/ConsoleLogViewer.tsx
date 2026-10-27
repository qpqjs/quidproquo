import { StoryResult } from 'quidproquo-core';

import { memo } from 'react';
import { ObjectInspector } from 'react-inspector';

import { useConsoleLogViewer } from './hooks';

interface ConsoleLogViewerProps {
  logs: StoryResult<any>['logs'];
}

export const ConsoleLogViewer = ({ logs }: ConsoleLogViewerProps) => {
  const { formattedLogs } = useConsoleLogViewer(logs);

  if (!formattedLogs) {
    return null;
  }

  return (
    <div style={{ fontFamily: 'monospace' }}>
      {formattedLogs.map((log, index) => (
        <div key={index} style={{ display: 'flex', marginBottom: '5px' }}>
          <span style={{ marginRight: '5px' }}>{log.time} -</span>
          {log.args.map((arg: any, argIndex: number) => (
            <span key={argIndex} style={{ marginRight: '5px', paddingTop: '3px' }}>
              <ObjectInspector data={arg} />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

export default memo(ConsoleLogViewer);
