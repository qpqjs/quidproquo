import { useBaseUrlResolvers, useStateUpdater } from 'quidproquo-web-react';

import { AppBar, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Tab, Tabs } from '@mui/material';

import { apiRequestPost } from '../../logic';
import { EventTimeline } from '../EventTimeline'; // Add this import
import { useLogTreeData } from '../hooks';
import { LogCorrelations } from '../LogCorrelations';
import { LogRawJson } from '../LogRawJson';
import { LogSummary } from '../LogSummary';
import { useLoadedStoryResult, useLogDialogStateManagement } from './hooks';
import { HelpTab, LogDetailsTab, NotesTab, RawTab, TimelineTab, TraceTab, TreeTab } from './tabs';

interface LogDialogProps {
  open: boolean;
  logCorrelation: string;
  handleClose: () => void;
  storyResultMetadatas: any[];
  setSelectedLogCorrelation: (logCorrelation: string) => void;
}

function downloadJson(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  // The URL.revokeObjectURL() method releases an existing object URL
  URL.revokeObjectURL(url);
}

const getTabStyle = (tabIndex: number, selectedTab: number) => ({
  display: selectedTab === tabIndex ? 'block' : 'none',
  height: '100%',
});

export const LogDialog = ({ logCorrelation, open, handleClose, setSelectedLogCorrelation }: LogDialogProps) => {
  const [logDialogState, logDialogStateApi] = useLogDialogStateManagement();
  const asyncLog = useLoadedStoryResult(logCorrelation);
  const urlResolvers = useBaseUrlResolvers();

  const handleExecute = async () => {
    if (asyncLog.log) {
      await apiRequestPost('http://localhost:8080/admin/service/log/execute', asyncLog.log, urlResolvers.getApiUrl());
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    logDialogStateApi.setSelectedTab(newValue);
  };

  const treeApi = useLogTreeData(logCorrelation, false);

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
      <DialogTitle id="scroll-dialog-title">Log Details - {logCorrelation}</DialogTitle>
      <AppBar color="primary" position="sticky">
        <Tabs indicatorColor="secondary" onChange={handleTabChange} textColor="inherit" value={logDialogState.selectedTab}>
          <Tab label="Log Details" />
          <Tab label="Tree" />
          <Tab label="Timeline" />
          <Tab label="Notes" />
          <Tab label="Raw JSON" />
          <Tab label="Trace" />
          <Tab label="Help" />
        </Tabs>
      </AppBar>
      <DialogContent
        dividers={true}
        sx={{
          minHeight: '150px',
          overflowY: 'scroll',
        }}
      >
        {asyncLog.isLoading && <LinearProgress />}
        <div style={getTabStyle(logDialogState.selectedTab, 0)}>
          <LogDetailsTab log={asyncLog} logDialogState={logDialogState} logDialogStateApi={logDialogStateApi} />
        </div>
        <div style={getTabStyle(logDialogState.selectedTab, 1)}>
          <TreeTab
            isVisible={logDialogState.selectedTab === 1}
            log={asyncLog}
            setSelectedLogCorrelation={setSelectedLogCorrelation}
            treeApi={treeApi}
          />
        </div>
        <div style={getTabStyle(logDialogState.selectedTab, 2)}>
          <TimelineTab
            isVisible={logDialogState.selectedTab === 2}
            log={asyncLog}
            setSelectedLogCorrelation={setSelectedLogCorrelation}
            treeApi={treeApi}
          />
        </div>
        <div style={getTabStyle(logDialogState.selectedTab, 3)}>
          <NotesTab log={asyncLog} />
        </div>
        <div style={getTabStyle(logDialogState.selectedTab, 4)}>
          <RawTab log={asyncLog} />
        </div>
        <div style={getTabStyle(logDialogState.selectedTab, 5)}>
          {/* keyed on the correlation so walking the tree remounts the tab with fresh
              trace state instead of showing the previous log's trace */}
          <TraceTab key={logCorrelation} isVisible={logDialogState.selectedTab === 5} log={asyncLog} />
        </div>
        <div style={getTabStyle(logDialogState.selectedTab, 6)}>
          <HelpTab log={asyncLog} />
        </div>
      </DialogContent>

      <DialogActions>
        <Button disabled={asyncLog.isLoading} onClick={(event) => treeApi.refreshTreeData()} style={getTabStyle(logDialogState.selectedTab, 1)}>
          Refresh Tree
        </Button>
        <Button disabled={asyncLog.isLoading} onClick={(event) => treeApi.refreshTreeData()} style={getTabStyle(logDialogState.selectedTab, 2)}>
          Refresh Timeline
        </Button>
        <Button
          disabled={asyncLog.isLoading}
          onClick={(event) => {
            if (asyncLog.log) {
              downloadJson(JSON.stringify(asyncLog.log, null, 2), `${asyncLog.log.correlation}.json`);
            }
            event.stopPropagation();
          }}
        >
          Download
        </Button>
        {asyncLog.log && (
          <Button disabled={asyncLog.isLoading} onClick={handleExecute}>
            Execute
          </Button>
        )}
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
