/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { createQpqRuntimeDefinition, useQpqRuntime } from 'quidproquo-web-react';

import LockIcon from '@mui/icons-material/Lock';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { AsyncButton } from '../../components';
import { AuthState } from '../logic';
import { authChallengeMfaInitalState, authChallengeMfaLogic, authChallengeMfaReducer } from './logic';

interface AuthChallengeSoftwareTokenMfaProps {
  authState: AuthState;
}

const challengeRuntime = createQpqRuntimeDefinition({
  uniqueName: 'qpq/admin/authChallengeSoftwareTokenMfa',
  api: authChallengeMfaLogic,
  initialState: authChallengeMfaInitalState,
  reducer: authChallengeMfaReducer,
});

export function AuthChallengeSoftwareTokenMfa({ authState }: AuthChallengeSoftwareTokenMfaProps) {
  const [api, state] = useQpqRuntime(challengeRuntime);
  const isCodeValid = /^\d{6}$/.test(state.mfaCode);

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
              Verification Code
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography color="text.secondary" variant="body2">
              Enter the 6-digit code from your authenticator app.
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              autoFocus
              fullWidth
              id="mfaCode"
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
              label="Authentication Code"
              onChange={(event) => api.authChallengeSetMfaCode(event.target.value.replace(/\D/g, ''))}
              required
              value={state.mfaCode}
            />
          </Grid>
          <Grid item xs={12}>
            <AsyncButton
              disabled={!isCodeValid}
              onClick={() =>
                api.authChallengeSendMfaCode(
                  authState.authenticateUserResponse?.challenge!,
                  authState.authenticateUserResponse?.session!,
                  authState.username,
                )
              }
            >
              Verify
            </AsyncButton>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
