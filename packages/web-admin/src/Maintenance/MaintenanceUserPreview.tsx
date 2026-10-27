import { MaintenanceLevel, MaintenancePublicState } from 'quidproquo-features';

import { Box, Chip, Paper, Typography } from '@mui/material';

type MaintenanceUserPreviewProps = {
  /** The PUBLIC projection — never the raw fold, so internal notes physically cannot render here. */
  publicState: MaintenancePublicState;
  /** Whether users can currently see this maintenance at all (open draft, has updates, not Internal). */
  visible: boolean;
};

const MS_PER_MINUTE = 60_000;

const etaText = (etaEndsAt: string): string => {
  const remainingMins = Math.ceil((new Date(etaEndsAt).getTime() - Date.now()) / MS_PER_MINUTE);
  return remainingMins <= 0 ? 'taking a little longer than expected' : `expected back in ~${remainingMins} min${remainingMins === 1 ? '' : 's'}`;
};

// A stylised mock of the end-user surface, rendered ONLY from the public
// projection — its whole job is letting the editor confirm nothing private
// landed in a user-visible field. Not pixel-faithful: a banner strip over
// either the app (Info/Low) or the lock screen breakdown (High).
export function MaintenanceUserPreview({ publicState, visible }: MaintenanceUserPreviewProps) {
  const isHigh = publicState.level === MaintenanceLevel.High;
  const isInfo = publicState.level === MaintenanceLevel.Info;
  const updatesNewestFirst = [...publicState.updates].reverse();

  return (
    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, position: 'sticky', top: 16 }} variant="outlined">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ flexGrow: 1 }} variant="subtitle2">
          What users see
        </Typography>
        {!visible && <Chip label="Nothing — hidden" size="small" />}
      </Box>

      {/* The mock browser frame. */}
      <Box sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
        {/* Window chrome. */}
        <Box sx={{ display: 'flex', gap: 0.75, px: 1.5, py: 1, bgcolor: 'action.hover' }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((dot) => (
            <Box key={dot} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: dot }} />
          ))}
        </Box>

        {/* The banner strip — only while the maintenance is publicly visible. */}
        {visible && (
          <Box
            sx={{
              px: 1.5,
              py: 1,
              textAlign: 'center',
              fontSize: 12,
              fontWeight: 600,
              bgcolor: isInfo ? 'info.main' : 'warning.main',
              color: isInfo ? 'info.contrastText' : 'warning.contrastText',
            }}
          >
            {publicState.bannerText || publicState.reason}
            {publicState.etaEndsAt && ` — ${etaText(publicState.etaEndsAt)}`}
          </Box>
        )}

        {visible && isHigh ? (
          // The lock screen breakdown.
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.25, textAlign: 'center' }}>
            <Typography variant="subtitle1">Maintenance in progress</Typography>
            <Typography color="text.secondary" variant="caption">
              {publicState.bannerText || publicState.reason}
              {publicState.affectedServices && ` · Affected: ${publicState.affectedServices.join(', ')}`}
            </Typography>
            <Box
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                fontSize: 11,
                fontWeight: 700,
                bgcolor: 'warning.main',
                color: 'warning.contrastText',
              }}
            >
              Do NOT refresh or close this tab
            </Box>
            {updatesNewestFirst.length > 0 && (
              <Box sx={{ width: '100%', textAlign: 'left', bgcolor: 'action.hover', borderRadius: 1, p: 1.25, maxHeight: 180, overflowY: 'auto' }}>
                {updatesNewestFirst.map((update) => (
                  <Box key={update.id} sx={{ mb: 0.75 }}>
                    <Typography variant="caption">{update.displayText}</Typography>
                    <Typography color="text.secondary" display="block" sx={{ fontSize: 10 }} variant="caption">
                      {new Date(update.createdAt).toLocaleTimeString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ) : (
          // Info/Low (or hidden): the app keeps working under the banner.
          <Box
            sx={{
              m: 2,
              height: 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1,
              border: 1,
              borderStyle: 'dashed',
              borderColor: 'divider',
            }}
          >
            <Typography color="text.secondary" variant="body2">
              App
            </Typography>
          </Box>
        )}
      </Box>

      <Typography color="text.secondary" variant="caption">
        Rendered from the public state only — internal notes can never appear here.
      </Typography>
    </Paper>
  );
}
