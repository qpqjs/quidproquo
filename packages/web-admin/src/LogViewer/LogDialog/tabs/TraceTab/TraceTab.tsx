import { QpqExecutionTrace, QpqRuntimeType } from 'quidproquo-core';
import { WebSocketQueueQpqAdminServerEventMessageTraceDone, WebSocketQueueQpqAdminServerMessageEventType } from 'quidproquo-features';
import { useAuthAccessToken, useBaseUrlResolvers, useSubscribeToWebSocketEvent } from 'quidproquo-web-react';

import React, { useEffect, useRef, useState } from 'react';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import { Alert, Box, Button, Checkbox, FormControlLabel, LinearProgress, Tooltip, Typography } from '@mui/material';

import { getLogTrace } from '../../../logic';
import { TraceViewer } from '../../../TraceViewer';
import { AsyncStoryState } from '../../hooks';
import { MovedToColdStorage } from '../../MovedToColdStorage';

interface TraceTabProps {
  log: AsyncStoryState;
  isVisible: boolean;
}

// Backstop for a missed TraceDone websocket message (reconnect gaps, dev servers
// without the admin socket). checkOnly polls never trigger trace runs.
const PENDING_POLL_MS = 15_000;

// Async trace flow: the first open only checks for a stored trace — found ones load
// immediately, otherwise an explainer with a Begin Trace button is shown. Beginning a
// trace kicks off a fire-and-forget run in the owning service and this tab waits for
// its TraceDone websocket push (with a slow checkOnly poll as a fallback). See
// trace-replay-plan.md.
export const TraceTab: React.FC<TraceTabProps> = ({ log, isVisible }) => {
  const urlResolvers = useBaseUrlResolvers();
  const accessToken = useAuthAccessToken();

  const [trace, setTrace] = useState<QpqExecutionTrace | undefined>(undefined);
  const [isWaiting, setIsWaiting] = useState(false);
  const [traceError, setTraceError] = useState<string | undefined>(undefined);
  const [hasRequested, setHasRequested] = useState(false);
  const [hasCheckedForStoredTrace, setHasCheckedForStoredTrace] = useState(false);

  // "My code only" — held here so Begin Trace / Re-run Trace can send it: a trace with
  // it on sets no breakpoints outside the user's own code. Every step pause freezes the
  // replay for several inspector round trips, so full traces of real bundles burn the
  // whole wall-clock budget on framework glue — own-code-only is the sane default.
  const [hideExternalSteps, setHideExternalSteps] = useState(true);

  // The request a stale async response must not clobber (rapid re-runs, dialog reuse)
  const requestVersionRef = useRef(0);

  const requestTrace = async (options: { refresh?: boolean; checkOnly?: boolean; onlyOwnCode?: boolean }) => {
    const requestVersion = ++requestVersionRef.current;
    if (!options.checkOnly) {
      setIsWaiting(true);
      setTraceError(undefined);
    }

    try {
      const result = await getLogTrace(urlResolvers.getApiUrl(), log.logCorrelation, options, accessToken);
      if (requestVersion !== requestVersionRef.current) {
        return;
      }

      if (result.trace) {
        setTrace(result.trace);
        setIsWaiting(false);
      } else if (result.pending && !options.checkOnly) {
        // check=true reports pending whenever no trace is stored — the server can't
        // tell idle from in-flight — so only a real trace request may start waiting
        setIsWaiting(true);
      } else if (!options.checkOnly) {
        setTraceError('No trace was produced for this log');
        setIsWaiting(false);
      }
    } catch (error) {
      if (requestVersion !== requestVersionRef.current) {
        return;
      }
      setTraceError(error instanceof Error ? error.message : String(error));
      setIsWaiting(false);
    }
  };

  useEffect(() => {
    if (isVisible && !hasRequested && !log.isLoading && !log.isLogInColdStorage) {
      setHasRequested(true);
      // First open never starts a trace — it only loads a stored one; starting one is
      // the explicit Begin Trace action below
      requestTrace({ checkOnly: true }).finally(() => setHasCheckedForStoredTrace(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, hasRequested, log.isLoading, log.isLogInColdStorage]);

  // The owning service finished tracing — the log service pushed the result
  useSubscribeToWebSocketEvent(
    WebSocketQueueQpqAdminServerMessageEventType.TraceDone,
    (webSocketService, message: WebSocketQueueQpqAdminServerEventMessageTraceDone) => {
      if (message.payload.correlation !== log.logCorrelation || !isWaiting) {
        return;
      }

      if (message.payload.succeeded) {
        requestTrace({ checkOnly: true });
      } else {
        setTraceError(message.payload.errorText || 'Trace failed');
        setIsWaiting(false);
      }
    },
  );

  // Poll fallback while waiting — checkOnly, so it can never stack trace runs
  useEffect(() => {
    if (!isWaiting) {
      return;
    }
    const pollTimer = setInterval(() => requestTrace({ checkOnly: true }), PENDING_POLL_MS);
    return () => clearInterval(pollTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWaiting]);

  if (log.isLoading) {
    return <div>Loading...</div>;
  }

  if (log.isLogInColdStorage) {
    return <MovedToColdStorage guid={log.logCorrelation} />;
  }

  if (isWaiting) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography sx={{ mb: 1 }} variant="body2">
          Tracing in {log.log?.moduleName ? `the ${log.log.moduleName} service` : 'the owning service'} — replaying the log and recording every
          statement. This can take a minute; the result appears here when it lands.
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (traceError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          action={
            <Button color="inherit" onClick={() => requestTrace({ refresh: true, onlyOwnCode: hideExternalSteps })} size="small">
              Retry
            </Button>
          }
          severity="error"
        >
          {traceError}
        </Alert>
      </Box>
    );
  }

  if (!trace) {
    if (!hasCheckedForStoredTrace) {
      return null;
    }

    // No stored trace — explain what tracing is and let the user start one explicitly.
    // Begin Trace deliberately leaves refresh false so a trace that landed since the
    // check is served straight from storage instead of re-running.
    const isTraceable = log.log?.runtimeType === QpqRuntimeType.EXECUTE_STORY;

    return (
      <Box sx={{ alignItems: 'center', display: 'flex', height: '100%', justifyContent: 'center', p: 3 }}>
        <Box sx={{ maxWidth: 560, textAlign: 'center' }}>
          <TroubleshootIcon color="primary" sx={{ fontSize: 56, mb: 1 }} />
          <Typography gutterBottom variant="h6">
            Step-through execution trace
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }} variant="body2">
            A trace replays this log inside the service that ran it, recording every statement it executes and the local variables at each step — then
            you can scrub through the run line by line, like a time-travel debugger for exactly what happened.
          </Typography>
          {!isTraceable && (
            <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
              Only {QpqRuntimeType.EXECUTE_STORY} logs can be traced — this is a {log.log?.runtimeType || 'different'} log. Use the Tree tab to walk
              down to the {QpqRuntimeType.EXECUTE_STORY} runs it triggered and trace those instead.
            </Alert>
          )}
          {isTraceable && (
            <Box sx={{ mb: 1 }}>
              <FormControlLabel
                control={<Checkbox checked={hideExternalSteps} onChange={(event) => setHideExternalSteps(event.target.checked)} size="small" />}
                label={
                  <Typography variant="body2">
                    My code only — trace just this service&apos;s own source (much faster; framework internals get no steps)
                  </Typography>
                }
              />
            </Box>
          )}
          <Button disabled={!isTraceable} onClick={() => requestTrace({ onlyOwnCode: hideExternalSteps })} variant="contained">
            Begin Trace
          </Button>
          {isTraceable && (
            <Typography color="text.secondary" display="block" sx={{ mt: 1.5 }} variant="caption">
              Runs in {log.log?.moduleName ? `the ${log.log.moduleName} service` : 'the owning service'} and can take a minute.
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%' }}>
      <TraceViewer
        actions={
          <Tooltip
            title={hideExternalSteps ? 'Re-traces with breakpoints only in your own code — the whole step budget goes to your statements' : ''}
          >
            <Button onClick={() => requestTrace({ refresh: true, onlyOwnCode: hideExternalSteps })} size="small" sx={{ flexShrink: 0 }}>
              Re-run Trace{hideExternalSteps ? ' (my code only)' : ''}
            </Button>
          </Tooltip>
        }
        hideExternalSteps={hideExternalSteps}
        onHideExternalStepsChange={setHideExternalSteps}
        trace={trace}
      />
    </Box>
  );
};
