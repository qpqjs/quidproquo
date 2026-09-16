import { eventDocAiContext } from 'quidproquo-features';
import { useEffectCallback } from 'quidproquo-web-react';
import { QpqContextProvider, useQpqWebsocketQueueRuntime } from 'quidproquo-web-react';

import React, { useEffect, useRef, useState } from 'react';
import { Android as AndroidIcon, Person as PersonIcon } from '@mui/icons-material';
import { Avatar, Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';

import { useAdminApp } from '../../adminApp';
import { eventDocAiLogChatRuntime } from './eventDocAiLogChatRuntime';
import { EventDocAiSegments } from './EventDocAiSegments';

interface LogChatProps {
  logServiceName: string;
  logCorrelation: string;
}

const LogChatConversation: React.FC<{ logCorrelation: string }> = ({ logCorrelation }) => {
  const [inputMessage, setInputMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [api, state] = useQpqWebsocketQueueRuntime(eventDocAiLogChatRuntime, logCorrelation);
  const [adminApi] = useAdminApp();

  const streamSegments = state.streamSegments;
  const isThinking = state.isSending && streamSegments.length === 0;

  const handleSendMessage = useEffectCallback(() => {
    if (inputMessage.trim() !== '') {
      // Audit trail (session event) and actual chat transport are separate concerns.
      adminApi.sendChatMessage(logCorrelation, inputMessage);
      api.eventDocAiSendMessage(inputMessage);
      setInputMessage('');
    }
  });

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [state.chatMessages, streamSegments]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box ref={chatContainerRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {state.isLoadingHistory && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={20} />
          </Box>
        )}
        {state.chatMessages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              mb: 2,
              justifyContent: message.role === 'assistant' ? 'flex-start' : 'flex-end',
            }}
          >
            <Paper
              sx={{
                p: 2,
                borderRadius: message.role === 'assistant' ? '20px 20px 20px 0' : '20px 20px 0 20px',
                backgroundColor: message.role === 'assistant' ? 'grey.300' : 'primary.main',
                color: message.role === 'assistant' ? 'black' : 'white',
                maxWidth: '70%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ mr: 1, bgcolor: message.role === 'assistant' ? 'grey.500' : 'primary.dark' }}>
                  {message.role === 'assistant' ? <AndroidIcon /> : <PersonIcon />}
                </Avatar>
                <Typography variant="subtitle2">{message.role === 'assistant' ? 'AI Assistant' : 'You'}</Typography>
              </Box>
              <EventDocAiSegments segments={message.segments} />
            </Paper>
          </Box>
        ))}
        {streamSegments.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, justifyContent: 'flex-start' }}>
            <Paper sx={{ p: 2, borderRadius: '20px 20px 20px 0', backgroundColor: 'grey.300', color: 'black', maxWidth: '70%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ mr: 1, bgcolor: 'grey.500' }}>
                  <AndroidIcon />
                </Avatar>
                <Typography variant="subtitle2">AI Assistant</Typography>
              </Box>
              <EventDocAiSegments segments={streamSegments} />
            </Paper>
          </Box>
        )}
        {isThinking && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, justifyContent: 'flex-start' }}>
            <Paper sx={{ p: 2, borderRadius: '20px 20px 20px 0', backgroundColor: 'grey.300', color: 'black', maxWidth: '70%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body1">Thinking...</Typography>
              </Box>
            </Paper>
          </Box>
        )}
        {state.error && (
          <Typography color="error" sx={{ mt: 1 }} variant="body2">
            {state.error}
          </Typography>
        )}
      </Box>
      <Box sx={{ p: 2, borderTop: '1px solid #ccc' }}>
        <Box sx={{ display: 'flex' }}>
          <TextField
            fullWidth
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about this log..."
            sx={{ mr: 2 }}
            value={inputMessage}
            variant="outlined"
          />
          <Button onClick={handleSendMessage} variant="contained">
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

// The generic EventDocAi chat, scoped to this one log (docId = correlation id).
// See eventdoc-chat-plan.md — replaces the old one-off Claude chat.
export const LogChat: React.FC<LogChatProps> = ({ logServiceName, logCorrelation }) => {
  if (!logServiceName) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  return (
    <QpqContextProvider contextIdentifier={eventDocAiContext} value={{ serviceName: logServiceName, type: 'log', docId: logCorrelation }}>
      <LogChatConversation logCorrelation={logCorrelation} />
    </QpqContextProvider>
  );
};
