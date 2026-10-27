import React from 'react';
import { Autocomplete, FormControl, TextField } from '@mui/material';

export interface AutocompleteOption {
  label: string;
  value: string;
}

interface AutocompleteInputProps {
  label: string;
  value?: string;
  options: AutocompleteOption[];
  onChange: (value: string) => void;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ label, value, options, onChange }: AutocompleteInputProps) => {
  const handleChange = (event: React.SyntheticEvent, newValue: AutocompleteOption | null) => {
    onChange(newValue ? newValue.value : '');
  };

  const selectedValue = options.find((option) => option.value === value) || null;

  return (
    <FormControl fullWidth>
      <Autocomplete
        getOptionLabel={(option) => option.label}
        onChange={handleChange}
        options={options}
        renderInput={(params) => (
          <TextField
            {...params}
            InputLabelProps={{
              shrink: true,
            }}
            label={label}
          />
        )}
        value={selectedValue}
      />
    </FormControl>
  );
};
