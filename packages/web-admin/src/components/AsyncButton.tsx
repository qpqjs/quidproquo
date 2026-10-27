import React, { ReactNode, useState } from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

interface AsyncButtonProps {
  onClick: (event: any) => Promise<void>;
  children?: ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function AsyncButton({ onClick, children, disabled, type }: AsyncButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: any) => {
    setLoading(true);
    try {
      await onClick(event);
    } catch (error) {
      console.error('Login error:', error);
      // Handle error, show a message, etc.
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      color="primary"
      disabled={loading || disabled}
      fullWidth
      onClick={handleLogin}
      style={{ maxHeight: '100%', height: '4em' }}
      type={type}
      variant="contained"
    >
      {loading ? <CircularProgress size={24} /> : children}
    </Button>
  );
}
