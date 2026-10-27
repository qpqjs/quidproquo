import { createQpqRuntimeDefinition, useQpqRuntime } from 'quidproquo-web-react';

import { useEffect, useRef } from 'react';
import LockIcon from '@mui/icons-material/Lock';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { AsyncButton } from '../../components';
import { AuthState } from '../logic';
import { authChallengeMfaSetupInitalState, authChallengeMfaSetupLogic, authChallengeMfaSetupReducer } from './logic';

interface AuthChallengeMfaSetupProps {
  authState: AuthState;
}

const challengeRuntime = createQpqRuntimeDefinition({
  uniqueName: 'qpq/admin/authChallengeMfaSetup',
  api: authChallengeMfaSetupLogic,
  initialState: authChallengeMfaSetupInitalState,
  reducer: authChallengeMfaSetupReducer,
});

// otpauth:// URI consumed by authenticator apps when scanning / importing.
const buildOtpAuthUri = (email: string, secretCode: string): string => {
  const issuer = window.location.host;
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${secretCode}&issuer=${encodeURIComponent(issuer)}`;
};

export function AuthChallengeMfaSetup({ authState }: AuthChallengeMfaSetupProps) {
  const [api, state] = useQpqRuntime(challengeRuntime);
  const isCodeValid = /^\d{6}$/.test(state.mfaCode);

  const challenge = authState.authenticateUserResponse?.challenge;
  const session = authState.authenticateUserResponse?.session;

  // Associate a software token once, using the MFA_SETUP challenge session.
  const hasAssociated = useRef(false);
  useEffect(() => {
    if (!hasAssociated.current && session) {
      hasAssociated.current = true;
      api.authChallengeAssociateSoftwareToken(session);
    }
  }, [api, session]);

  if (!challenge || !session) {
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
              Set Up Authenticator
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography color="text.secondary" variant="body2">
              Add this account to your authenticator app, then enter the 6-digit code it generates.
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography color="text.secondary" variant="caption">
              Secret key
            </Typography>
            <Typography sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }} variant="body1">
              {state.secretCode || 'Loading…'}
            </Typography>
          </Grid>
          {state.secretCode && (
            <Grid item xs={12}>
              <Typography color="text.secondary" sx={{ wordBreak: 'break-all' }} variant="caption">
                {buildOtpAuthUri(authState.username, state.secretCode)}
              </Typography>
            </Grid>
          )}
          <Grid item xs={12}>
            <TextField
              autoFocus
              fullWidth
              id="mfaCode"
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
              label="Authentication Code"
              onChange={(event) => api.authChallengeSetMfaSetupCode(event.target.value.replace(/\D/g, ''))}
              required
              value={state.mfaCode}
            />
          </Grid>
          <Grid item xs={12}>
            <AsyncButton
              disabled={!isCodeValid || !state.secretCode}
              onClick={() => api.authChallengeSendMfaSetupCode(challenge, authState.username)}
            >
              Verify
            </AsyncButton>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
