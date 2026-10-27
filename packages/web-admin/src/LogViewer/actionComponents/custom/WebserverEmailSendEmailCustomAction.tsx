import { EmailSendEmailActionPayload } from 'quidproquo-webserver';

import { Box, Typography } from '@mui/material';

import ActionResultDisplay from '../genericActionRenderer/ActionResultDisplay';
import { ActionComponent } from '../types';

const headerStyles = {
  card: {
    backgroundColor: '#1F1F1F',
    borderRadius: '5px',
    padding: '10px 12px',
    marginBottom: '8px',
  },
  label: {
    color: '#68CDFE',
    fontWeight: 600,
    minWidth: 72,
  },
  value: {
    color: '#CE834A',
    wordBreak: 'break-word' as const,
  },
  iframe: {
    width: '100%',
    minHeight: 320,
    border: 'thin solid #333',
    borderRadius: '5px',
    background: '#ffffff',
  },
  textBody: {
    backgroundColor: '#1F1F1F',
    color: '#68CDFE',
    padding: '10px',
    borderRadius: '5px',
    whiteSpace: 'pre-wrap' as const,
    wordWrap: 'break-word' as const,
    margin: 0,
  },
};

type HeaderRowProps = {
  label: string;
  value?: string[] | string;
};

const HeaderRow = ({ label, value }: HeaderRowProps) => {
  const text = Array.isArray(value) ? value.join(', ') : value;

  if (!text) {
    return null;
  }

  return (
    <Box display="flex" gap={1} sx={{ my: 0.25 }}>
      <Typography component="span" sx={headerStyles.label} variant="body2">
        {label}
      </Typography>
      <Typography component="span" sx={headerStyles.value} variant="body2">
        {text}
      </Typography>
    </Box>
  );
};

export const WebserverEmailSendEmailCustomAction: ActionComponent<EmailSendEmailActionPayload, string> = ({ action, result, expanded }) => {
  if (!action.payload) {
    return null;
  }

  const { from, to, cc, bcc, replyTo, subject, bodyHtml, bodyText, attachments } = action.payload;

  return (
    <Box sx={{ width: '100%', my: 1 }}>
      <Box sx={headerStyles.card}>
        <HeaderRow label="To:" value={to} />
        <HeaderRow label="From:" value={from} />
        <HeaderRow label="Cc:" value={cc} />
        <HeaderRow label="Bcc:" value={bcc} />
        <HeaderRow label="Reply-To:" value={replyTo} />
        <HeaderRow label="Subject:" value={subject} />
        {attachments && attachments.length > 0 && <HeaderRow label="Attachments:" value={`${attachments.length}`} />}
      </Box>

      {bodyHtml ? (
        // Sandbox with no allow-list: renders the email markup but blocks scripts,
        // form submission and same-origin access to the admin.
        <iframe sandbox="" srcDoc={bodyHtml} style={headerStyles.iframe} title="Email HTML body" />
      ) : (
        <pre style={headerStyles.textBody}>{bodyText}</pre>
      )}

      <ActionResultDisplay action={action} expanded={expanded} result={result} />
    </Box>
  );
};
