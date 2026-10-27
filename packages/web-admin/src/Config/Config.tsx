import { WebsocketAdminClientMessageEventType, WebSocketQueueClientEventMessageQpqAdminConfigSyncRequest } from 'quidproquo-features';
import { useWebsocketSendEvent } from 'quidproquo-web-react';

import React, { useState } from 'react';
import { Box, CssBaseline, Drawer, List, ListItem, ListItemButton, ListItemText, Tab, Tabs, TextField, Toolbar, Typography } from '@mui/material';
import { useOnMount } from '@mui/x-data-grid/internals';

import { useAdminApp, useSessionState } from '../adminApp';
import { useServiceNames } from '../LogViewer/hooks';

const drawerWidth = 240;

const sections = ['General', 'Settings', 'Advanced'];

export function Config() {
  const [tabIndex, setTabIndex] = useState(0);
  const [search, setSearch] = useState('');
  const services = useServiceNames();

  const [api] = useAdminApp();
  const session = useSessionState();
  const sendMessage = useWebsocketSendEvent();

  useOnMount(() => {
    const configSyncRequestEvent: WebSocketQueueClientEventMessageQpqAdminConfigSyncRequest = {
      type: WebsocketAdminClientMessageEventType.ConfigSyncRequest,
      payload: {},
    };

    api.applyConfigSyncRequested();
    sendMessage(configSyncRequestEvent);
  });

  const handleServiceClick = (service: string) => {
    api.applyConfigServiceSelected(service);
    setTabIndex(0);
  };

  const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
    setTabIndex(newIndex);
  };

  const filteredServices = services.filter((s) => s.label.toLowerCase().includes(search.toLowerCase()));
  const selectedService = session.configSelectedService || services[0]?.label;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* Sidebar */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
        variant="permanent"
      >
        <Toolbar>
          <TextField
            fullWidth
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearch(filteredServices[0]?.label);
                handleServiceClick(filteredServices[0]?.label);
              }
            }}
            placeholder="Search services"
            size="small"
            sx={{ mt: 2 }}
            value={search}
            variant="outlined"
          />
        </Toolbar>
        <Box sx={{ overflow: 'auto', p: 2 }}>
          <List>
            {filteredServices.map((service) => (
              <ListItem key={service.value} disablePadding>
                <ListItemButton onClick={() => handleServiceClick(service.label)} selected={service.label === selectedService}>
                  <ListItemText primary={service.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography gutterBottom variant="h5">
          {selectedService} Service
        </Typography>

        {/* Tabs */}
        <Tabs onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }} value={tabIndex}>
          {sections.map((section, index) => (
            <Tab key={index} label={section} />
          ))}
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ mt: 2 }}>
          {sections[tabIndex] === 'General' && <Typography>General settings for {selectedService}</Typography>}
          {sections[tabIndex] === 'Settings' && <Typography>Custom configuration options</Typography>}
          {sections[tabIndex] === 'Advanced' && <Typography>Advanced tuning and overrides</Typography>}
        </Box>
      </Box>
    </Box>
  );
}

export default Config;
