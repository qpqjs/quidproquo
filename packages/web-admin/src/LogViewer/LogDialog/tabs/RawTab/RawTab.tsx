import React from 'react';

import { LogRawJson } from '../../../LogRawJson';
import { AsyncStoryState } from '../../hooks';
import { MovedToColdStorage } from '../../MovedToColdStorage';

interface RawTabProps {
  log: AsyncStoryState;
}

export const RawTab: React.FC<RawTabProps> = ({ log }) => {
  if (log.isLoading) {
    return <div>Loading...</div>;
  }

  if (log.isLogInColdStorage) {
    return <MovedToColdStorage guid={log.logCorrelation} />;
  }

  return <LogRawJson log={log.log} />;
};
