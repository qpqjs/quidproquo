import React from 'react';

import { EventTimeline } from '../../../EventTimeline';
import { TreeApi } from '../../../hooks';
import { AsyncStoryState } from '../../hooks';

interface TimelineTabProps {
  log: AsyncStoryState;

  isVisible: boolean;
  setSelectedLogCorrelation: (correlation: string) => void;

  treeApi: TreeApi;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({
  log,

  isVisible,
  setSelectedLogCorrelation,

  treeApi,
}) => {
  if (log.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <EventTimeline
      isVisible={isVisible}
      logCorrelation={log.logCorrelation}
      setSelectedLogCorrelation={setSelectedLogCorrelation}
      treeApi={treeApi}
    />
  );
};
