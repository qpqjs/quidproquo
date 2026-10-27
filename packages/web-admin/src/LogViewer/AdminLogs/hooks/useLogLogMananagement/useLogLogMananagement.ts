import { LogLog } from 'quidproquo-features';

import { CorrelationOpenSource, useAdminApp, useSessionState } from '../../../../adminApp';

export const useLogLogMananagement = () => {
  const [api] = useAdminApp();
  const session = useSessionState();

  const selectedLogCorrelation = session.openCorrelation ?? '';

  const setSelectedLogCorrelation = (correlation?: string) => {
    if (correlation) {
      api.applyCorrelationOpened(correlation, CorrelationOpenSource.grid);
    } else {
      api.applyCorrelationClosed();
    }
  };

  const onRowClick = ({ row }: { row: LogLog }) => {
    setSelectedLogCorrelation(row.fromCorrelation);
  };

  const clearSelectedLogCorrelation = () => {
    api.applyCorrelationClosed();
  };

  return {
    selectedLogCorrelation,
    setSelectedLogCorrelation,

    onRowClick,
    clearSelectedLogCorrelation,
  };
};
