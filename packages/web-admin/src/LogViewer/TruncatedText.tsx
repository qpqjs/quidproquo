import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { IconButton, Typography } from '@mui/material';

import { useTruncatedText } from './hooks';

const TruncatedText = ({ title, text, expanded }: { title: string; text: string; expanded: boolean }) => {
  const { canTruncate, truncatedText, handleCopy } = useTruncatedText(text);

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          position: 'absolute',
          left: '-45px',
          top: '-10px',
        }}
      >
        <IconButton onClick={handleCopy} style={{ marginLeft: '8px' }}>
          <ContentCopyIcon />
        </IconButton>
      </div>
      <pre
        style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          display: 'inline',
        }}
      >
        {title}: {!expanded && canTruncate ? truncatedText : text}
      </pre>
    </div>
  );
};

export default TruncatedText;
