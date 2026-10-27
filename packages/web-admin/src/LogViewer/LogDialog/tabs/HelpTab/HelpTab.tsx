import React from 'react';

import { useVolatileState } from '../../../../adminApp';
import { LogChat } from '../../../LogChat';
import { AsyncStoryState } from '../../hooks';

interface HelpTabProps {
  log: AsyncStoryState;
}

export const HelpTab: React.FC<HelpTabProps> = ({ log }) => {
  const volatile = useVolatileState();

  return <LogChat logCorrelation={log.logCorrelation} logServiceName={volatile.logServiceName} />;
};
