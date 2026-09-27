import { generateUuid } from 'quidproquo-core';
import { EventDocSummary, MaintenanceEffect, MaintenanceLevel, MaintenanceType, toEventDocListItem } from 'quidproquo-features';
import { useAuthAccessToken, useBaseUrlResolvers } from 'quidproquo-web-react';

import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Alert, Box, Button, Chip, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

import { appendMaintenanceEvent, createMaintenance, fetchMaintenanceSummaries } from './logic';
import { MaintenanceUpdateFormValues, UpdateDialog } from './UpdateDialog';

const CREATE_PREFILL = {
  bannerText: 'The site is undergoing a scheduled update',
  reason: 'Maintenance started',
  level: MaintenanceLevel.Low,
  maintenanceType: MaintenanceType.Deploy,
  affectedServices: null,
  internalNotes: '',
};

type MaintenanceListProps = {
  onOpen: (docId: string) => void;
};

// All maintenances, newest first — active (open draft) vs closed (published).
// "New maintenance" BEGINS one: the doc is created, its initial settings are
// appended (level last, so a High lock only engages once the reason/type/eta
// are already in the broadcast state), and the editor opens.
export function MaintenanceList({ onOpen }: MaintenanceListProps) {
  const urlResolvers = useBaseUrlResolvers();
  const accessToken = useAuthAccessToken();

  const [summaries, setSummaries] = useState<EventDocSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setSummaries(await fetchMaintenanceSummaries(urlResolvers.getApiUrl(), accessToken));
    } catch (loadError) {
      setError(`Failed to load maintenances: ${loadError}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create = the first update: one doc, one ADD_UPDATE carrying the full status
  // snapshot — the maintenance is live (and broadcast) from that single append.
  const onCreate = async (values: MaintenanceUpdateFormValues) => {
    setCreating(true);
    setError(null);
    try {
      const apiBaseUrl = urlResolvers.getApiUrl();
      const summary = await createMaintenance(values.bannerText || values.reason, values.maintenanceType.toLowerCase(), apiBaseUrl, accessToken);

      await appendMaintenanceEvent(summary.id, MaintenanceEffect.AddUpdate, { updateId: generateUuid(), ...values }, apiBaseUrl, accessToken);

      setCreateOpen(false);
      onOpen(summary.id);
    } catch (createError) {
      setError(`Failed to create maintenance: ${createError}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography sx={{ flexGrow: 1 }} variant="h5">
          Maintenance
        </Typography>
        <Button onClick={load} startIcon={<RefreshIcon />}>
          Refresh
        </Button>
        <Button onClick={() => setCreateOpen(true)} startIcon={<AddIcon />} variant="contained">
          New maintenance
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summaries.map((summary) => {
              const item = toEventDocListItem(summary);
              return (
                <TableRow key={summary.id} hover onClick={() => onOpen(summary.id)} sx={{ cursor: 'pointer' }}>
                  <TableCell>{summary.name}</TableCell>
                  <TableCell>{item.hasDraft ? <Chip color="warning" label="Active" size="small" /> : <Chip label="Closed" size="small" />}</TableCell>
                  <TableCell>{new Date(summary.updatedAt).toLocaleString()}</TableCell>
                  <TableCell>{new Date(summary.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              );
            })}
            {summaries.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography color="text.secondary" sx={{ p: 2 }} variant="body2">
                    No maintenances yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <UpdateDialog
        busy={creating}
        confirmLabel="Begin maintenance"
        initialValues={CREATE_PREFILL}
        onCancel={() => setCreateOpen(false)}
        onSave={onCreate}
        open={createOpen}
        title="New maintenance"
      />
    </Box>
  );
}
