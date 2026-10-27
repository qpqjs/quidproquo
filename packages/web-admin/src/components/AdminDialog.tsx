import { useState } from 'react';
import { AppBar, Button, Dialog, DialogActions, DialogContent, DialogTitle, Tab, Tabs } from '@mui/material';

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

interface AdminDialogProps {
  open: boolean;
  handleClose: () => void;

  title: string;

  tabs: string[];
  selectedTab: string;
  onSelectTab: (tabName: string) => void;

  buttons: {
    text: string;
    onClick: () => Promise<void>;
    disabled: boolean;
  }[];

  children: React.ReactNode;
}

export const AdminDialog = ({ open, handleClose, title, selectedTab, onSelectTab, tabs, buttons, children }: AdminDialogProps) => {
  const selectedTabIndex = tabs.findIndex((t) => t === selectedTab);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    onSelectTab(tabs[newValue]);
  };

  return (
    <Dialog
      aria-describedby="scroll-dialog-description"
      aria-labelledby="scroll-dialog-title"
      fullWidth={true}
      maxWidth={false}
      onClose={handleClose}
      open={open}
      PaperProps={{
        style: {
          width: '90%',
          height: '90%',
          maxHeight: '90%',
          maxWidth: '90%',
        },
      }}
      scroll={'paper'}
    >
      <DialogTitle id="scroll-dialog-title">{title}</DialogTitle>
      {tabs.length > 0 && (
        <AppBar color="primary" position="sticky">
          <Tabs indicatorColor="secondary" onChange={handleTabChange} textColor="inherit" value={selectedTabIndex}>
            {tabs.map((t) => (
              <Tab key={t} label={t} />
            ))}
          </Tabs>
        </AppBar>
      )}
      <DialogContent
        dividers={true}
        sx={{
          minHeight: '150px',
          overflowY: 'scroll',
        }}
      >
        {children}
      </DialogContent>

      {buttons.length > 0 && (
        <DialogActions>
          {buttons.map((b) => (
            <Button key={b.text} disabled={b.disabled} onClick={b.onClick}>
              {b.text}
            </Button>
          ))}
        </DialogActions>
      )}
    </Dialog>
  );
};
