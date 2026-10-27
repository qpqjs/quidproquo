import { useEffect, useMemo } from 'react';

import { CorrelationOpenSource, logSearchKey, useAdminApp, useSessionState, useVolatileState } from '../adminApp';
import { TabViewBox } from '../components/TabViewBox';
import { useIsLoading } from '../view/Loading/hooks/useIsLoading';
import { LogMetadataGrid } from './LogMetadataGrid';
import { TopSection } from './TopSection';

declare global {
  interface Window {
    logs: any;
    viewLog: any;
  }
}

export const LogSearch = () => {
  const [api] = useAdminApp();
  const session = useSessionState();
  const volatile = useVolatileState();
  const isLoading = useIsLoading();

  const results = volatile.logResults[logSearchKey(session.search)];
  const logs = useMemo(() => results?.logs ?? [], [results?.logs]);

  useEffect(() => {
    window.logs = logs;
    window.viewLog = (log: any) => api.applyCorrelationOpened(log.correlation, CorrelationOpenSource.grid);
  }, [logs, api]);

  useEffect(() => {
    console.log('logs attached to window, try: viewLog(logs[0])');
  }, []);

  return (
    <TabViewBox
      body={() => <LogMetadataGrid isLoading={isLoading || !!results?.isSearching} logs={logs} />}
      header={() => <TopSection onSearch={() => api.runLogSearch()} />}
    />
  );
};
