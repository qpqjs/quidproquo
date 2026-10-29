import { useState } from 'react';

export const useAdminDialog = (tabs: string[], defaultTab: string) => {
  const [open, setIsOpen] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<string>(defaultTab);

  return {
    open,
    tabs,
    selectedTab,
    openDialog: () => setIsOpen(true),
    onSelectTab: (tab: string) => {
      setSelectedTab(tab);
    },
    handleClose: () => setIsOpen(false),
  };
};
