import { EventDocAiMessageSegment } from 'quidproquo-features';

import React from 'react';
import Markdown from 'react-markdown';
import { Box, Chip, Typography } from '@mui/material';

interface EventDocAiSegmentsProps {
  segments: EventDocAiMessageSegment[];
}

// Renders one message's segments — text (markdown), reasoning (dimmed), tool
// calls (a chip per tool, showing input and, once it arrives, output), and
// file attachments. Used for both finalized messages and the live stream
// preview (the live stream is folded into the same segment shape).
export const EventDocAiSegments: React.FC<EventDocAiSegmentsProps> = ({ segments }) => (
  <>
    {segments.map((segment, index) => {
      if (segment.type === 'text') {
        return <Markdown key={index}>{segment.text}</Markdown>;
      }

      if (segment.type === 'reasoning') {
        return (
          <Typography key={index} sx={{ fontStyle: 'italic', opacity: 0.7, mb: 1 }} variant="body2">
            {segment.text}
          </Typography>
        );
      }

      if (segment.type === 'file') {
        return <Chip key={index} label={segment.attachment.filename} size="small" sx={{ mb: 1 }} />;
      }

      return (
        <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
          {segment.tools.map((tool, toolIndex) => (
            <Box
              key={toolIndex}
              sx={{
                p: 1,
                borderRadius: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.06)',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
              }}
            >
              <Typography component="div" sx={{ fontWeight: 'bold' }} variant="caption">
                {tool.output === undefined ? `Calling ${tool.toolName}…` : tool.toolName}
              </Typography>
              <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(tool.input)}
              </Box>
              {tool.output !== undefined && (
                <Box component="pre" sx={{ m: 0, mt: 0.5, whiteSpace: 'pre-wrap', wordBreak: 'break-all', opacity: 0.8 }}>
                  {JSON.stringify(tool.output)}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      );
    })}
  </>
);
