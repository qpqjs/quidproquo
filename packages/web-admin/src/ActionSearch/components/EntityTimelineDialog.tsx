import { Nullable } from 'quidproquo-core';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { DateCell } from '../../components/DateCell/DateCell';
import { EntityTimeline } from '../types/EntityTimeline';

type EntityTimelineDialogProps = {
  timeline: Nullable<EntityTimeline>;
  onClose: () => void;
  onOpenLog: (correlation: string) => void;
};

// Presentational only: the parent fetches the timeline in the row-click handler
export const EntityTimelineDialog = ({ timeline, onClose, onOpenLog }: EntityTimelineDialogProps) => (
  <Dialog fullWidth maxWidth="md" onClose={onClose} open={!!timeline}>
    <DialogTitle>Timeline</DialogTitle>
    <DialogContent>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>Service</TableCell>
            <TableCell>Error</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {(timeline?.rows ?? []).map((row) => (
            <TableRow key={`${row.correlation}#${row.actionIndex}`}>
              <TableCell>
                <DateCell isoDateTime={row.startedAt} />
              </TableCell>
              <TableCell>{row.actionType}</TableCell>
              <TableCell>{row.moduleName}</TableCell>
              <TableCell>{row.error ?? ''}</TableCell>
              <TableCell>
                <Button onClick={() => onOpenLog(row.correlation)} size="small">
                  Open log
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DialogContent>
  </Dialog>
);
