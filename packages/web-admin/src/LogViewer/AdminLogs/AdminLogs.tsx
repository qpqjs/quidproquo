import { getSearchProgress, logLogSearchKey, useAdminApp, useSessionState, useVolatileState } from '../../adminApp';
import { TabViewBox } from '../../components/TabViewBox';
import { useIsLoading } from '../../view/Loading/hooks/useIsLoading';
import { AdminLogGrid } from './AdminLogGrid/AdminLogGrid';
import { AdminLogSearchBar } from './AdminLogSearchBar/AdminLogSearchBar';

export const AdminLogs = () => {
  const [api] = useAdminApp();
  const session = useSessionState();
  const volatile = useVolatileState();
  const isLoading = useIsLoading();

  const results = volatile.logLogResults[logLogSearchKey(session.search)];

  return (
    <TabViewBox
      body={() => (
        <AdminLogGrid isLoading={isLoading || !!results?.isSearching} logs={results?.logLogs ?? []} searchProgress={getSearchProgress(results)} />
      )}
      header={() => <AdminLogSearchBar onSearch={() => api.runLogLogSearch()} />}
    />
  );
};
