import { WebsocketAdminClientMessageEventType, WebSocketQueueClientEventMessageQpqAdminEventDocReprojectRequest } from '@qpqjs/features';
import { useWebsocketSendEvent } from '@qpqjs/web-react';

import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';

/**
 * Asks every service to reproject its event docs: each walks the collections it owns and re-runs the projector at
 * every document's head, which rebuilds list rows and snapshots. Safe to press at any time, since a document already
 * up to date is skipped. The work runs on each service's queues, so this only confirms the request was sent.
 */
export function EventDocReprojectButton() {
  const [wasRequested, setWasRequested] = useState(false);
  const sendMessage = useWebsocketSendEvent();

  const handleClick = () => {
    const reprojectRequestEvent: WebSocketQueueClientEventMessageQpqAdminEventDocReprojectRequest = {
      type: WebsocketAdminClientMessageEventType.EventDocReprojectRequest,
      payload: {},
    };

    sendMessage(reprojectRequestEvent);
    setWasRequested(true);
  };

  return (
    <Box sx={{ alignItems: 'center', display: 'flex', gap: 2, mb: 2 }}>
      <Button onClick={handleClick} size="small" variant="outlined">
        Reproject event docs
      </Button>
      <Typography color="text.secondary" variant="body2">
        {wasRequested
          ? 'Requested. Every service is rebuilding its event doc list rows and snapshots in the background.'
          : 'Rebuilds every event doc list row and snapshot, across all services. Documents already up to date are skipped.'}
      </Typography>
    </Box>
  );
}
