import { logLevelEnumLookups } from 'quidproquo-core';

import { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Autocomplete, IconButton, Menu } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { Box } from '@mui/system';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { useSearchFields } from '../../../adminApp';
import { AsyncButton } from '../../../components/AsyncButton';
import { useServiceNames } from '../../hooks';

export interface AdminLogSearchBarProps {
  onSearch: () => Promise<any>;
}

export function AdminLogSearchBar({ onSearch }: AdminLogSearchBarProps) {
  const serviceOptions = useServiceNames();

  const {
    service,
    handleServiceOnChange,
    startDate,
    handleStartDateChange,
    endDate,
    handleEndDateChange,
    msg,
    handleMsgOnChange,
    updateStartAndEndTimeSpan,
    logLevel,
    handleLogLevelOnChange,
  } = useSearchFields();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleQuickTimeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleQuickTimeClose = () => {
    setAnchorEl(null);
  };

  const handleQuickTimeSelect = (minutes: number) => {
    updateStartAndEndTimeSpan(minutes);
    handleQuickTimeClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid columns={12} container spacing={2}>
        <Grid item xs={3}>
          <FormControl fullWidth>
            <InputLabel id="runtime-select-label">Log Level</InputLabel>
            <Select id="demo-simple-select" label="Log Level" labelId="runtime-select-label" onChange={handleLogLevelOnChange} value={logLevel}>
              {logLevelEnumLookups.map((key) => (
                <MenuItem key={key} value={key}>
                  {key}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={3}>
          <FormControl fullWidth>
            <Autocomplete
              getOptionLabel={(option) => option.label}
              onChange={handleServiceOnChange}
              options={serviceOptions}
              renderInput={(params) => (
                <TextField
                  {...params}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  label="Service Name"
                />
              )}
              value={serviceOptions.find((o) => o.value === service) || null}
            />
          </FormControl>
        </Grid>
        <Grid item xs={3}>
          <Box position="relative">
            <FormControl fullWidth>
              <DateTimePicker label="Start DateTime" onChange={handleStartDateChange} value={startDate} />
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
        <Grid item xs={3}>
          <FormControl fullWidth>
            <DateTimePicker label="End DateTime" onChange={handleEndDateChange} value={endDate} />
          </FormControl>
        </Grid>
        <Grid item xs={10}>
          <FormControl fullWidth>
            <TextField
              InputLabelProps={{
                shrink: true,
              }}
              label="Message"
              onChange={handleMsgOnChange}
              value={msg}
            />
          </FormControl>
        </Grid>
        <Grid item xs={2}>
          <AsyncButton onClick={() => onSearch()}>Search</AsyncButton>
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
}
