import { LogMetadata, WebSocketQueueQpqAdminServerEventMessageLogMetadata, WebSocketQueueQpqAdminServerMessageEventType } from 'quidproquo-features';
import { uniqueBy } from 'quidproquo-web';
import { useEffectCallback, useRunEvery, useSubscribeToWebSocketEvent, useThrottledMemo } from 'quidproquo-web-react';

import React, { useEffect, useMemo } from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';

import { dashboardErrorsSearchKey, useAdminApp, useVolatileState } from '../adminApp';
import { TabViewBox } from '../components/TabViewBox';
import { useIsLoading } from '../view/Loading/hooks/useIsLoading';
import { LogMetadataGrid } from './LogMetadataGrid';

const getLogCountForSinceXDaysAgo = (logs: LogMetadata[], daysAgo: number) => {
  const currentDate = new Date();
  const daysAgoDate = new Date(currentDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const daysAgoString = daysAgoDate.toISOString();

  const logCount = logs.reduce((count, log) => (daysAgoString < log.startedAt && !log.checked ? count + 1 : count), 0);

  return logCount;
};

const getHoursSinceStartOfDay = (): number => {
  const now = new Date();
  return now.getHours();
};

interface DashboardProps {}

export const Dashboard: React.FC<DashboardProps> = () => {
  const [api] = useAdminApp();
  const volatile = useVolatileState();
  const isLoading = useIsLoading();

  const results = volatile.logResults[dashboardErrorsSearchKey];
  const weeklyLogs = useMemo(() => results?.logs ?? [], [results?.logs]);
  const realtimeLogs = volatile.realtimeErrorLogs;

  // Stable identity so the mount-only effect below can list it as a dependency.
  const runInitialSearch = useEffectCallback(() => {
    api.runDashboardErrorSearch();
  });

  useEffect(() => {
    runInitialSearch();
  }, [runInitialSearch]);

  useSubscribeToWebSocketEvent(
    WebSocketQueueQpqAdminServerMessageEventType.LogMetadata,
    (webSocketService, message: WebSocketQueueQpqAdminServerEventMessageLogMetadata) => {
      api.receiveRealtimeErrorLog(message.payload.log);
    },
  );

  const hoursPassedToday = useRunEvery(getHoursSinceStartOfDay, 60);

  const allLogs = useThrottledMemo(() => {
    const uniqueLogs = uniqueBy([...realtimeLogs, ...weeklyLogs], (log) => log.correlation);
    return uniqueLogs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [realtimeLogs, weeklyLogs]);

  const dailyErrorCount = useMemo(() => getLogCountForSinceXDaysAgo(allLogs, hoursPassedToday / 24), [allLogs, hoursPassedToday]);
  const weeklyErrorCount = useMemo(() => getLogCountForSinceXDaysAgo(allLogs, 7), [allLogs]);

  return (
    <TabViewBox>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography>Daily Errors</Typography>
            <Typography variant="h4">{dailyErrorCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography>Weekly Errors</Typography>
            <Typography variant="h4">{weeklyErrorCount}</Typography>
          </Paper>
        </Grid>
      </Grid>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <LogMetadataGrid isLoading={isLoading || !!results?.isSearching} logs={allLogs} />
      </Box>
    </TabViewBox>
  );
};
