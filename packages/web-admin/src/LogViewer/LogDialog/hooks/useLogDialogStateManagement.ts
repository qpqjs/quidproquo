import { useStateUpdater } from 'quidproquo-web-react';

import { useState } from 'react';

export type LogDialogState = {
  selectedTab: number;
  hideFastActions: boolean;
  orderByDuration: boolean;
};

export type LogDialogStateApi = {
  setSelectedTab: (tabIndex: number) => void;
  setHideFastActions: (hideFastActions: boolean) => void;
  setOrderByDuration: (orderByDuration: boolean) => void;
};

export const useLogDialogStateManagement = (): [LogDialogState, LogDialogStateApi] => {
  const [logDialogState, setLogDialogState] = useState<LogDialogState>({
    selectedTab: 0,
    hideFastActions: false,
    orderByDuration: false,
  });

  const updateLogDialogState = useStateUpdater(setLogDialogState);

  return [
    logDialogState,
    {
      setSelectedTab: updateLogDialogState('selectedTab'),
      setHideFastActions: updateLogDialogState('hideFastActions'),
      setOrderByDuration: updateLogDialogState('orderByDuration'),
    },
  ];
};
