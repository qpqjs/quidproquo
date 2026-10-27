import React from 'react';

import { LogSummary } from '../../../LogSummary';
import { AsyncStoryState } from '../../hooks';
import { MovedToColdStorage } from '../../MovedToColdStorage';

interface NotesTabProps {
  log: AsyncStoryState;
}

export const NotesTab: React.FC<NotesTabProps> = ({ log }) => {
  if (log.isLoading) {
    return <div>Loading...</div>;
  }

  if (log.isLogInColdStorage) {
    return <MovedToColdStorage guid={log.logCorrelation} />;
  }

  return <LogSummary log={log.log} />;
};
