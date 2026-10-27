import { useQpqRuntime } from 'quidproquo-web-react';

import LogoutIcon from '@mui/icons-material/Logout';
import { BottomNavigation, BottomNavigationAction, CircularProgress } from '@mui/material';
import Box from '@mui/material/Box';

import { useAdminApp, useSessionState } from '../../adminApp';
import { authRuntime } from '../../Auth/logic';
import { useTabs } from './hooks/useTabs';

export function MainLayout() {
  const { tabs, loading } = useTabs();
  const [adminApi] = useAdminApp();
  const { tab } = useSessionState();
  const [authApi] = useQpqRuntime(authRuntime);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          pb: '56px', // <— prevent content from being hidden behind bottom nav
        }}
      >
        {tabs
          .filter((t, index) => index === tab)
          .map((tab) => (
            <tab.View key={tab.name} />
          ))}
      </Box>

      <BottomNavigation
        onChange={(event, newValue) => {
          // The trailing Logout / Loading actions are not tabs
          if (newValue < tabs.length) {
            adminApi.applyTabChanged(newValue, tabs[newValue].name);
          }
        }}
        showLabels
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: (theme) => theme.zIndex.drawer + 1,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
        value={tab}
      >
        {tabs.map((t) => (
          <BottomNavigationAction key={t.name} icon={t.icon} label={t.name} />
        ))}
        {loading && <BottomNavigationAction disabled icon={<CircularProgress size={18} />} label="Loading" />}
        <BottomNavigationAction
          icon={<LogoutIcon />}
          label="Logout"
          onClick={async () => {
            // Record sessionEnded and drain the audit log before the tokens go.
            await adminApi.endSession();
            authApi.authLogout();
          }}
        />
      </BottomNavigation>
    </Box>
  );
}
