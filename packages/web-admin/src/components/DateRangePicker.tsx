import React, { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, FormControl, Grid, IconButton, Menu, MenuItem } from '@mui/material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface DateRangePickerProps {
  startIsoDateTime: string;
  endIsoDateTime: string;
  setStartIsoDateTime: (isoString: string) => void;
  setEndIsoDateTime: (isoString: string) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ startIsoDateTime, endIsoDateTime, setStartIsoDateTime, setEndIsoDateTime }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleStartDateChange = (value: Date | null) => {
    if (value) {
      setStartIsoDateTime(value.toISOString());
    }
  };

  const handleEndDateChange = (value: Date | null) => {
    if (value) {
      setEndIsoDateTime(value.toISOString());
    }
  };

  const handleQuickTimeSelect = (minutes: number) => {
    const now = new Date();
    const startDate = new Date(now.getTime() - minutes * 60000);
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60000);

    setStartIsoDateTime(startDate.toISOString());
    setEndIsoDateTime(endDate.toISOString());

    setAnchorEl(null);
  };

  const handleQuickTimeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleQuickTimeClose = () => {
    setAnchorEl(null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box position="relative">
            <FormControl fullWidth>
              <DateTimePicker label="Start DateTime" onChange={handleStartDateChange} value={new Date(startIsoDateTime)} />
            </FormControl>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box position="relative">
            <FormControl fullWidth>
              <DateTimePicker label="End DateTime" onChange={handleEndDateChange} value={new Date(endIsoDateTime)} />
            </FormControl>
            <IconButton
              aria-controls="quick-time-menu"
              aria-haspopup="true"
              aria-label="quick time select"
              onClick={handleQuickTimeClick}
              sx={{
                position: 'absolute',
                right: '-28px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
        </Grid>
      </Grid>
      <Menu anchorEl={anchorEl} id="quick-time-menu" keepMounted onClose={handleQuickTimeClose} open={Boolean(anchorEl)}>
        <MenuItem onClick={() => handleQuickTimeSelect(5)}>Last 5 minutes</MenuItem>
        <MenuItem onClick={() => handleQuickTimeSelect(30)}>Last 30 minutes</MenuItem>
        <MenuItem onClick={() => handleQuickTimeSelect(1 * 60)}>Last hour</MenuItem>
        <MenuItem onClick={() => handleQuickTimeSelect(3 * 60)}>Last 3 hours</MenuItem>
        <MenuItem onClick={() => handleQuickTimeSelect(8 * 60)}>Last 8 hours</MenuItem>
        <MenuItem onClick={() => handleQuickTimeSelect(16 * 60)}>Last 16 hours</MenuItem>
        <MenuItem onClick={() => handleQuickTimeSelect(24 * 60)}>Last 24 hours</MenuItem>
        <MenuItem onClick={() => handleQuickTimeSelect(7 * 24 * 60)}>Last 7 days</MenuItem>
        <MenuItem onClick={() => handleQuickTimeSelect(30 * 24 * 60)}>Last month</MenuItem>
      </Menu>
    </LocalizationProvider>
  );
};
