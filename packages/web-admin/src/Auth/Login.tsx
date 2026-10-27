import LockIcon from '@mui/icons-material/Lock';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

import { AsyncButton } from '../components';
import { authLogic } from './logic';

interface LoginProps {
  username: string;
  password: string;

  setUsername: (username: string) => void;
  setPassword: (password: string) => void;

  onLogin: () => Promise<void>;
}

export function Login({ username, password, setUsername, setPassword, onLogin }: LoginProps) {
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box action="#" autoComplete="on" component="form" method="post" sx={{ width: '100%', maxWidth: 360 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center' }} variant="h5">
              <LockIcon sx={{ marginRight: 1 }} />
              QPQ Admin
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              autoComplete="username"
              autoFocus
              fullWidth
              id="username"
              label="Username"
              onChange={(event) => setUsername(event.target.value)}
              required
              type="username"
              value={username}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              autoComplete="current-password"
              fullWidth
              id="password"
              label="Password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </Grid>
          <Grid item xs={12}>
            <AsyncButton
              onClick={async (event) => {
                event.preventDefault();
                await onLogin();
              }}
              type="submit"
            >
              Login
            </AsyncButton>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
