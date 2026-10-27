/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { createQpqRuntimeDefinition, useQpqRuntime } from 'quidproquo-web-react';

import LockIcon from '@mui/icons-material/Lock';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { AsyncButton } from '../../components';
import { AuthState } from '../logic';
import { authChallengeInitalState, authChallengeLogic, authChallengeReducer } from './logic';

interface AuthChallengeNewPasswordRequiredProps {
  authState: AuthState;
}

const challengeRuntime = createQpqRuntimeDefinition({
  uniqueName: 'qpq/admin/authChallengeNewPasswordRequired',
  api: authChallengeLogic,
  initialState: authChallengeInitalState,
  reducer: authChallengeReducer,
});

export function AuthChallengeNewPasswordRequired({ authState }: AuthChallengeNewPasswordRequiredProps) {
  const [api, state] = useQpqRuntime(challengeRuntime);
  const arePasswordsMatching = state.passwordA === state.passwordB && state.passwordA !== '';

  if (!authState.authenticateUserResponse || !authState.authenticateUserResponse.challenge || !authState.authenticateUserResponse.session) {
    return <div>Error, missing challenge / session</div>;
  }

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
      <Box component="form" sx={{ width: '100%', maxWidth: 360 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center' }} variant="h5">
              <LockIcon sx={{ marginRight: 1 }} />
              Password Change Required
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              autoFocus
              fullWidth
              id="newPassword"
              label="New Password"
              onChange={(event) => api.authChallengeSetPasswordA(event.target.value)}
              required
              type="password"
              value={state.passwordA}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="confirmPassword"
              label="Confirm Password"
              onChange={(event) => api.authChallengeSetPasswordB(event.target.value)}
              required
              type="password"
              value={state.passwordB}
            />
          </Grid>
          <Grid item xs={12}>
            <AsyncButton
              disabled={!arePasswordsMatching}
              onClick={() =>
                api.authChallengeSendPasswords(
                  authState.authenticateUserResponse?.challenge!,
                  authState.authenticateUserResponse?.session!,
                  authState.username,
                )
              }
            >
              Update Password
            </AsyncButton>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
