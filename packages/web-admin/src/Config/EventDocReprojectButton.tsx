import {
  EventDocReprojectSource,
  WebsocketAdminClientMessageEventType,
  WebSocketQueueClientEventMessageQpqAdminEventDocReprojectRequest,
} from '@qpqjs/features';
import { useWebsocketSendEvent } from '@qpqjs/web-react';

import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';

type EventDocReprojectButtonProps = {
  label: string;
  // What pressing it does, shown beside the button until it is pressed.
  description: string;
  // Where each service's walk finds its documents. Absent means the lists store.
  source?: EventDocReprojectSource;
};

/**
 * Asks every service to reproject its event docs: each walks the collections it owns and re-runs the projector at
 * every document's head, which rebuilds list rows and snapshots. Safe to press at any time, since a document already
 * up to date is skipped. The work runs on each service's queues, so this only confirms the request was sent.
 */
export function EventDocReprojectButton({ label, description, source }: EventDocReprojectButtonProps) {
  const [wasRequested, setWasRequested] = useState(false);
  const sendMessage = useWebsocketSendEvent();

  const handleClick = () => {
    const reprojectRequestEvent: WebSocketQueueClientEventMessageQpqAdminEventDocReprojectRequest = {
      type: WebsocketAdminClientMessageEventType.EventDocReprojectRequest,
      payload: source ? { source } : {},
    };

    sendMessage(reprojectRequestEvent);
    setWasRequested(true);
  };

  return (
    <Box sx={{ alignItems: 'center', display: 'flex', gap: 2, mb: 2 }}>
      <Button onClick={handleClick} size="small" variant="outlined">
        {label}
      </Button>
      <Typography color="text.secondary" variant="body2">
        {wasRequested ? 'Requested. Every service is working through its event docs in the background.' : description}
      </Typography>
    </Box>
  );
}
