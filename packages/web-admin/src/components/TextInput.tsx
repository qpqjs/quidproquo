import React from 'react';
import { FormControl, TextField } from '@mui/material';

interface TextInputProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}

export const TextInput: React.FC<TextInputProps> = ({ label, value, onChange }: TextInputProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <FormControl fullWidth>
      <TextField
        InputLabelProps={{
          shrink: true,
        }}
        label={label}
        onChange={handleChange}
        value={value || ''}
      />
    </FormControl>
  );
};
