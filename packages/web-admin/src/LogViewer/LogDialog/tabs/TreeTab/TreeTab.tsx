import React from 'react';

import { TreeApi } from '../../../hooks';
import { LogCorrelations } from '../../../LogCorrelations';
import { AsyncStoryState } from '../../hooks';

interface TreeTabProps {
  log: AsyncStoryState;

  isVisible: boolean;
  setSelectedLogCorrelation: (correlation: string) => void;

  treeApi: TreeApi;
}

export const TreeTab: React.FC<TreeTabProps> = ({
  log,

  isVisible,
  setSelectedLogCorrelation,

  treeApi,
}) => {
  if (log.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <LogCorrelations
      isVisible={isVisible}
      logCorrelation={log.logCorrelation}
      setSelectedLogCorrelation={setSelectedLogCorrelation}
      treeApi={treeApi}
    />
  );
};
