// federated.export: This file will be exported using module federation

import { getApiUrl } from 'quidproquo-web';

import { type CSSProperties, useState } from 'react';

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  width: '100vw',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  background: 'linear-gradient(135deg, #f5f7fa 0%, #e4ecf5 100%)',
  color: '#1a2733',
};

const buttonStyle: CSSProperties = {
  marginTop: '1.5rem',
  padding: '0.75rem 1.5rem',
  fontSize: '1rem',
  fontWeight: 600,
  color: '#ffffff',
  background: '#2b6cb0',
  border: 'none',
  borderRadius: '0.5rem',
  cursor: 'pointer',
};

const resultStyle: CSSProperties = {
  marginTop: '1.5rem',
  padding: '1rem 1.5rem',
  maxWidth: '80vw',
  fontFamily: 'ui-monospace, monospace',
  fontSize: '0.9rem',
  whiteSpace: 'pre-wrap',
  background: '#ffffff',
  border: '1px solid #cbd8e4',
  borderRadius: '0.5rem',
  color: '#1a2733',
};

const getShellApiBaseUrl = (): string => getApiUrl('shell');

export const WelcomeScreen = () => {
  const [healthResult, setHealthResult] = useState<string | null>(null);

  const onCheckHealth = async () => {
    setHealthResult('Checking…');
    try {
      const response = await fetch(`${getShellApiBaseUrl()}/v1/health`);
      const body = await response.json();
      setHealthResult(JSON.stringify(body, null, 2));
    } catch (error) {
      setHealthResult(`Request failed: ${(error as Error).message}`);
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: '3rem', margin: 0 }}>quidproquo</h1>
      <p style={{ fontSize: '1.25rem', color: '#51616f' }}>
        A functional, action-based web framework — pure generator stories in,
        serverless infrastructure out.
      </p>
      <p style={{ fontSize: '0.95rem', color: '#51616f' }}>
        This page is built with quidproquo itself: a federated view served by
        the shell service.
      </p>
      <button onClick={onCheckHealth} style={buttonStyle} type="button">
        Check shell health
      </button>
      {healthResult !== null && <pre style={resultStyle}>{healthResult}</pre>}
    </div>
  );
};
