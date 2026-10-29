import { useMemo } from 'react';

import { logSearchKey, useAdminApp, useSessionState, useVolatileState } from '../adminApp';
import { TabViewBox } from '../components/TabViewBox';
import { useIsLoading } from '../view/Loading/hooks/useIsLoading';
import { LogMetadataGrid } from './LogMetadataGrid';
import { TopSection } from './TopSection';

export const LogSearch = () => {
  const [api] = useAdminApp();
  const session = useSessionState();
  const volatile = useVolatileState();
  const isLoading = useIsLoading();

  const results = volatile.logResults[logSearchKey(session.search)];
  const logs = useMemo(() => results?.logs ?? [], [results?.logs]);

  return (
    <TabViewBox
      body={() => <LogMetadataGrid isLoading={isLoading || !!results?.isSearching} logs={logs} />}
      header={() => <TopSection onSearch={() => api.runLogSearch()} />}
    />
  );
};
