import { generateUuid, Nullable } from 'quidproquo-core';
import {
  EventDocEffect,
  EventDocEvent,
  EventDocStatus,
  isMaintenancePubliclyVisible,
  MaintenanceEffect,
  maintenanceEventDoc,
  MaintenanceLevel,
  MaintenanceType,
  MaintenanceUpdateEntry,
  toMaintenancePublicState,
} from 'quidproquo-features';
import { useAuthAccessToken, useBaseUrlResolvers } from 'quidproquo-web-react';

import { useEffect, useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EngineeringIcon from '@mui/icons-material/Engineering';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { appendMaintenanceEvent, fetchMaintenanceEvents } from './logic';
import { MaintenanceUserPreview } from './MaintenanceUserPreview';
import { MaintenanceUpdateFormPrefill, MaintenanceUpdateFormValues, UpdateDialog } from './UpdateDialog';

type MaintenanceEditorProps = {
  docId: string;
  onBack: () => void;
};

type DialogMode = { kind: 'closed' } | { kind: 'add' } | { kind: 'edit'; update: MaintenanceUpdateEntry } | { kind: 'reopen' };

// One maintenance: a read-only header card with the CURRENT folded state, and
// the update feed it derives from. The UPDATE is the only mutation — adding one
// (prefilled from the last, ETA blank against the running clock) moves the whole
// status; editing/deleting entries re-derives, so deleting the newest rolls the
// card back. Closing publishes; reopening demands a fresh update (level resets
// to Low in the prefill) so a maintenance closed at High never reopens locked.
export function MaintenanceEditor({ docId, onBack }: MaintenanceEditorProps) {
  const urlResolvers = useBaseUrlResolvers();
  const accessToken = useAuthAccessToken();

  const [events, setEvents] = useState<EventDocEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<DialogMode>({ kind: 'closed' });

  const folded = useMemo(() => (events ? maintenanceEventDoc.views.document.fold(events) : null), [events]);
  const isClosed = folded?.status === EventDocStatus.Published;

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        setEvents(await fetchMaintenanceEvents(docId, urlResolvers.getApiUrl(), accessToken));
      } catch (loadError) {
        setError(`Failed to load maintenance: ${loadError}`);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  const applyEvent = async (type: string, data: unknown): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      const event = await appendMaintenanceEvent(docId, type, data, urlResolvers.getApiUrl(), accessToken);
      setEvents((prev) => (prev ? [...prev, event] : [event]));
      return true;
    } catch (appendError) {
      setError(`Failed to save change: ${appendError}`);
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (!folded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>{error ? <Alert severity="error">{error}</Alert> : <CircularProgress />}</Box>
    );
  }

  const updatesNewestFirst = [...folded.updates].reverse();
  const lastUpdate: Nullable<MaintenanceUpdateEntry> = folded.updates[folded.updates.length - 1] ?? null;

  const addPrefill: MaintenanceUpdateFormPrefill = {
    bannerText: folded.bannerText,
    reason: folded.reason,
    level: folded.level,
    maintenanceType: folded.maintenanceType,
    affectedServices: folded.affectedServices,
    internalNotes: '',
  };

  // Reopen is "create from inside": reason/type/services carry over for
  // convenience, but the level RESETS to Low and there is no running clock.
  const reopenPrefill: MaintenanceUpdateFormPrefill = {
    ...addPrefill,
    level: MaintenanceLevel.Low,
  };

  const onDialogSave = async (values: MaintenanceUpdateFormValues) => {
    if (dialog.kind === 'edit') {
      await applyEvent(MaintenanceEffect.EditUpdate, { updateId: dialog.update.id, ...values });
    } else if (dialog.kind === 'reopen') {
      const reopened = await applyEvent(EventDocEffect.CreateDraft, undefined);
      if (reopened) {
        await applyEvent(MaintenanceEffect.AddUpdate, { updateId: generateUuid(), ...values });
      }
    } else {
      await applyEvent(MaintenanceEffect.AddUpdate, { updateId: generateUuid(), ...values });
    }
    setDialog({ kind: 'closed' });
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton aria-label="Back to maintenance list" onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>
        <Typography color="text.secondary" variant="body2">
          Maintenance
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* 70/30: the editor on the left, the what-users-see mock on the right. */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        <Box sx={{ flex: '1 1 70%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* The current folded state — read-only; it moves only via updates. */}
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }} variant="outlined">
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <EngineeringIcon color={isClosed ? 'disabled' : 'warning'} sx={{ fontSize: 40 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h5">{folded.bannerText || folded.name}</Typography>
                {folded.reason && folded.reason !== folded.bannerText && (
                  <Typography color="text.secondary" variant="body2">
                    Latest: {folded.reason}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  {isClosed ? <Chip label="Closed" size="small" /> : <Chip color="warning" label="Active" size="small" />}
                  <Chip
                    color={
                      folded.level === MaintenanceLevel.High && !isClosed ? 'error' : folded.level === MaintenanceLevel.Info ? 'info' : 'default'
                    }
                    label={
                      folded.level === MaintenanceLevel.High
                        ? 'High — UI locked'
                        : folded.level === MaintenanceLevel.Info
                          ? 'Info — banner'
                          : folded.level === MaintenanceLevel.Internal
                            ? 'Internal — hidden from users'
                            : 'Low — banner only'
                    }
                    size="small"
                    variant={folded.level === MaintenanceLevel.High ? 'filled' : 'outlined'}
                  />
                  <Chip label={folded.maintenanceType === MaintenanceType.Incident ? 'Incident' : 'Deploy'} size="small" variant="outlined" />
                  {folded.etaEndsAt && <Chip label={`Ends ~${new Date(folded.etaEndsAt).toLocaleTimeString()}`} size="small" variant="outlined" />}
                  <Chip
                    label={folded.affectedServices ? `Affected: ${folded.affectedServices.join(', ')}` : 'All services'}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
              {isClosed ? (
                <Button disabled={busy} onClick={() => setDialog({ kind: 'reopen' })} variant="contained">
                  Reopen maintenance
                </Button>
              ) : (
                <Button
                  color="success"
                  disabled={busy}
                  onClick={() => applyEvent(EventDocEffect.Publish, { effectiveFrom: new Date().toISOString() })}
                  variant="contained"
                >
                  Close maintenance
                </Button>
              )}
            </Box>
            {lastUpdate?.internalNotes && (
              <Typography color="text.secondary" sx={{ fontStyle: 'italic' }} variant="body2">
                Internal: {lastUpdate.internalNotes}
              </Typography>
            )}
          </Paper>

          <Divider />

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ flexGrow: 1 }} variant="h6">
              Updates
            </Typography>
            <Button disabled={isClosed || busy} onClick={() => setDialog({ kind: 'add' })} startIcon={<AddIcon />} variant="outlined">
              Add update
            </Button>
          </Box>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>ETA</TableCell>
                <TableCell>Internal notes</TableCell>
                <TableCell>Posted</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {updatesNewestFirst.map((update) => (
                <TableRow key={update.id} hover>
                  <TableCell sx={{ maxWidth: 420 }}>{update.reason}</TableCell>
                  <TableCell>
                    <Chip
                      color={update.level === MaintenanceLevel.High ? 'error' : update.level === MaintenanceLevel.Info ? 'info' : 'default'}
                      label={update.level}
                      size="small"
                      variant={update.level === MaintenanceLevel.High ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>{update.etaSetAt ? (update.etaDurationMins === null ? 'Cleared' : `${update.etaDurationMins}m`) : '—'}</TableCell>
                  <TableCell sx={{ maxWidth: 360 }}>
                    {update.internalNotes ? (
                      <Typography color="text.secondary" sx={{ fontStyle: 'italic' }} variant="body2">
                        {update.internalNotes}
                      </Typography>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {new Date(update.createdAt).toLocaleString()} — {update.createdByDisplayName}
                    {update.updatedAt ? ' (edited)' : ''}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {!isClosed && (
                      <>
                        <IconButton aria-label="Edit update" disabled={busy} onClick={() => setDialog({ kind: 'edit', update })} size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          aria-label="Delete update"
                          disabled={busy}
                          onClick={() => applyEvent(MaintenanceEffect.RemoveUpdate, { updateId: update.id })}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {folded.updates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary" sx={{ p: 1 }} variant="body2">
                      No updates posted yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <Box sx={{ flex: '0 0 30%', minWidth: 300 }}>
          <MaintenanceUserPreview publicState={toMaintenancePublicState(folded)} visible={isMaintenancePubliclyVisible(folded)} />
        </Box>
      </Box>

      <UpdateDialog
        busy={busy}
        confirmLabel={dialog.kind === 'reopen' ? 'Reopen maintenance' : dialog.kind === 'edit' ? 'Save update' : 'Add update'}
        currentEtaEndsAt={dialog.kind === 'reopen' ? null : folded.etaEndsAt}
        initialValues={
          dialog.kind === 'edit'
            ? {
                bannerText: dialog.update.bannerText,
                reason: dialog.update.reason,
                level: dialog.update.level,
                maintenanceType: dialog.update.maintenanceType,
                affectedServices: dialog.update.affectedServices,
                internalNotes: dialog.update.internalNotes,
              }
            : dialog.kind === 'reopen'
              ? reopenPrefill
              : addPrefill
        }
        onCancel={() => setDialog({ kind: 'closed' })}
        onSave={onDialogSave}
        open={dialog.kind !== 'closed'}
        title={dialog.kind === 'reopen' ? 'Reopen maintenance' : dialog.kind === 'edit' ? 'Edit update' : 'Add update'}
      />
    </Box>
  );
}
