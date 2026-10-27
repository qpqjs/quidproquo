import { Nullable } from 'quidproquo-core';
import { MaintenanceLevel, MaintenanceType } from 'quidproquo-features';

import { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';

import { useServiceNames } from '../LogViewer/hooks';
import { etaOptions } from './logic';

// What the dialog hands back — the full status snapshot one update carries.
// `etaDurationMins` undefined = no announcement (keep the running clock).
export type MaintenanceUpdateFormValues = {
  bannerText: string;
  reason: string;
  level: MaintenanceLevel;
  maintenanceType: MaintenanceType;
  affectedServices: Nullable<string[]>;
  internalNotes: string;
  etaDurationMins?: Nullable<number>;
};

export type MaintenanceUpdateFormPrefill = {
  bannerText: string;
  reason: string;
  level: MaintenanceLevel;
  maintenanceType: MaintenanceType;
  affectedServices: Nullable<string[]>;
  internalNotes: string;
};

type UpdateDialogProps = {
  open: boolean;
  busy: boolean;
  title: string;
  confirmLabel: string;
  /** Field prefill (usually the last update's snapshot). */
  initialValues: MaintenanceUpdateFormPrefill;
  /**
   * The running clock's end time, shown as a badge beside the blank ETA field.
   * When set, a blank ETA means "keep this clock"; when absent (create/reopen —
   * there is no live clock), blank means Unknown.
   */
  currentEtaEndsAt?: Nullable<string>;
  onCancel: () => void;
  onSave: (values: MaintenanceUpdateFormValues) => void;
};

const ETA_KEEP = 'keep';
const ETA_UNKNOWN = 'unknown';

// The ONE maintenance mutation: a full status snapshot. Every field prefills
// from the previous update except the ETA (blank, with the current end time as
// a badge — picking a block always restarts the clock from now) and the
// internal note (fresh each update).
export function UpdateDialog({ open, busy, title, confirmLabel, initialValues, currentEtaEndsAt, onCancel, onSave }: UpdateDialogProps) {
  const serviceOptions = useServiceNames();
  const hasRunningClock = !!currentEtaEndsAt;

  const [bannerText, setBannerText] = useState('');
  const [reason, setReason] = useState('');
  const [level, setLevel] = useState<MaintenanceLevel>(MaintenanceLevel.Low);
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>(MaintenanceType.Deploy);
  const [allServices, setAllServices] = useState(true);
  const [services, setServices] = useState<string[]>([]);
  const [internalNotes, setInternalNotes] = useState('');
  const [eta, setEta] = useState<string>(ETA_KEEP);

  useEffect(() => {
    if (open) {
      setBannerText(initialValues.bannerText);
      setReason(initialValues.reason);
      setLevel(initialValues.level);
      setMaintenanceType(initialValues.maintenanceType);
      setAllServices(initialValues.affectedServices === null);
      setServices(initialValues.affectedServices ?? []);
      setInternalNotes(initialValues.internalNotes);
      setEta(hasRunningClock ? ETA_KEEP : ETA_UNKNOWN);
    }
  }, [open, initialValues, hasRunningClock]);

  const onConfirm = () => {
    const etaDurationMins = eta === ETA_KEEP ? undefined : eta === ETA_UNKNOWN ? null : Number(eta);

    onSave({
      bannerText,
      reason,
      level,
      maintenanceType,
      affectedServices: allServices ? null : services,
      internalNotes,
      ...(etaDurationMins === undefined ? {} : { etaDurationMins }),
    });
  };

  return (
    <Dialog fullWidth maxWidth="sm" onClose={busy ? undefined : onCancel} open={open}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <TextField
          fullWidth
          helperText="The site-wide banner line (blank = the reason below is used)"
          label="Banner text"
          onChange={(e) => setBannerText(e.target.value)}
          size="small"
          value={bannerText}
        />

        <TextField
          fullWidth
          helperText="This update's status line (shown in the update feed)"
          label="Reason"
          multiline
          onChange={(e) => setReason(e.target.value)}
          size="small"
          value={reason}
        />

        <FormControl size="small">
          <InputLabel id="update-level">Level</InputLabel>
          <Select label="Level" labelId="update-level" onChange={(e) => setLevel(e.target.value as MaintenanceLevel)} value={level}>
            <MenuItem value={MaintenanceLevel.Internal}>Internal — invisible to users</MenuItem>
            <MenuItem value={MaintenanceLevel.Info}>Info — informational banner</MenuItem>
            <MenuItem value={MaintenanceLevel.Low}>Low — warning banner, users keep working</MenuItem>
            <MenuItem value={MaintenanceLevel.High}>High — locks the UI</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel id="update-type">Type</InputLabel>
          <Select label="Type" labelId="update-type" onChange={(e) => setMaintenanceType(e.target.value as MaintenanceType)} value={maintenanceType}>
            <MenuItem value={MaintenanceType.Deploy}>Deploy</MenuItem>
            <MenuItem value={MaintenanceType.Incident}>Incident</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="update-eta">ETA</InputLabel>
            <Select label="ETA" labelId="update-eta" onChange={(e) => setEta(e.target.value)} value={eta}>
              {hasRunningClock && <MenuItem value={ETA_KEEP}>Keep current</MenuItem>}
              <MenuItem value={ETA_UNKNOWN}>Unknown</MenuItem>
              {etaOptions
                .filter((option) => option.etaDurationMins !== null)
                .map((option) => (
                  <MenuItem key={option.label} value={String(option.etaDurationMins)}>
                    {option.label}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          {hasRunningClock && eta === ETA_KEEP && (
            <Chip label={`Ends ~${new Date(currentEtaEndsAt!).toLocaleTimeString()}`} size="small" variant="outlined" />
          )}
        </FormControl>

        <FormControlLabel
          control={<Checkbox checked={allServices} onChange={(e) => setAllServices(e.target.checked)} />}
          label="All services affected"
        />

        {!allServices && (
          <FormControl size="small">
            <InputLabel id="update-services">Affected services</InputLabel>
            <Select
              label="Affected services"
              labelId="update-services"
              multiple
              onChange={(e) => setServices(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              renderValue={(selected) => (selected as string[]).join(', ')}
              value={services}
            >
              {serviceOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Checkbox checked={services.includes(option.value)} size="small" />
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <TextField
          fullWidth
          helperText="Only visible to admins — what you're investigating / doing"
          label="Internal notes"
          minRows={3}
          multiline
          onChange={(e) => setInternalNotes(e.target.value)}
          value={internalNotes}
        />
      </DialogContent>
      <DialogActions>
        <Button disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={busy || !reason.trim()} onClick={onConfirm} variant="contained">
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
