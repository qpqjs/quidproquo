import { StoryResult } from 'quidproquo-core';
import {
  LogMetadata,
  WebsocketAdminClientMessageEventType,
  WebSocketQueueClientEventMessageQpqAdminMarkLogChecked,
  WebSocketQueueClientEventMessageQpqAdminRefreshLogMetadata,
  WebSocketQueueQpqAdminServerEventMessageLogMetadata,
  WebSocketQueueQpqAdminServerMessageEventType,
} from 'quidproquo-features';
import { useSubscribeToWebSocketEvent, useWebsocketSendEvent } from 'quidproquo-web-react';

import { useEffect, useState } from 'react';
import { Box, Checkbox, CircularProgress, FormControlLabel, Typography } from '@mui/material';

import { useAdminApp } from '../adminApp';

interface LogSummaryProps {
  log: StoryResult<any>;
}

export const LogSummary = ({ log }: LogSummaryProps) => {
  const [checkedLoading, setCheckedLoading] = useState(true);
  const [logMetadata, setLogMetadata] = useState<LogMetadata | null>(null);

  const [adminApi] = useAdminApp();
  const sendMessage = useWebsocketSendEvent();

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCheckedLoading(true);

    const checkEvent: WebSocketQueueClientEventMessageQpqAdminMarkLogChecked = {
      type: WebsocketAdminClientMessageEventType.MarkLogChecked,
      payload: {
        correlationId: log.correlation,
        checked: event.target.checked,
      },
    };

    adminApi.applyLogCheckToggled(log.correlation, event.target.checked);
    sendMessage(checkEvent);
  };

  useSubscribeToWebSocketEvent(
    WebSocketQueueQpqAdminServerMessageEventType.LogMetadata,
    (_webSocketService, message: WebSocketQueueQpqAdminServerEventMessageLogMetadata) => {
      if (message.payload.log.correlation !== log.correlation) {
        return;
      }

      setCheckedLoading(false);
      setLogMetadata(message.payload.log);
    },
  );

  useEffect(() => {
    const refreshEvent: WebSocketQueueClientEventMessageQpqAdminRefreshLogMetadata = {
      type: WebsocketAdminClientMessageEventType.RefreshLogMetadata,
      payload: {
        correlationId: log.correlation,
      },
    };

    sendMessage(refreshEvent);
  }, [log.correlation, sendMessage]);

  return (
    <Box sx={{ width: 1, p: 2 }}>
      <Typography gutterBottom variant="h6">
        Log Summary
      </Typography>
      <Typography>Correlation ID: {log.correlation}</Typography>
      <FormControlLabel
        control={checkedLoading ? <CircularProgress size={24} /> : <Checkbox checked={!!logMetadata?.checked} onChange={handleCheckboxChange} />}
        label="Mark as done"
      />
    </Box>
  );
};
