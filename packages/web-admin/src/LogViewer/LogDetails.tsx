import { StoryResult } from 'quidproquo-core';

import { Box, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';

import { ActionHistoryItemTimeStamp } from './ActionHistoryItemTimeStamp';
import { AnyActionHistoryItem } from './ActionRender';
import ConsoleLogViewer from './ConsoleLogViewer';
import { processLog } from './logic';
import { LogSummaryDetails } from './LogSummaryDetails';
import { LogSummaryReturn } from './LogSummaryReturn';

interface LogDetailsProps {
  log: StoryResult<any>;
  hideFastActions: boolean;
  orderByDuration: boolean;
}

const leftTableCell = {
  width: '200px',
  paddingRight: '30px',
  textAlign: 'right',
  verticalAlign: 'top',
  whiteSpace: 'break-spaces',
};

const rightTableCell = {
  paddingLeft: '60px',
  verticalAlign: 'top',
  whiteSpace: 'break-spaces',
  maxWidth: 'calc(100% - 200px - 30px - 60px)',
};

export const LogDetails = ({
  log,

  hideFastActions,
  orderByDuration,
}: LogDetailsProps) => {
  let history = processLog(log);

  if (hideFastActions) {
    history = history.filter((item) => {
      const duration = new Date(item.finishedAt).getTime() - new Date(item.startedAt).getTime();
      return duration >= 500;
    });
  }

  if (orderByDuration) {
    history.sort((a, b) => {
      const durationA = new Date(a.finishedAt).getTime() - new Date(a.startedAt).getTime();
      const durationB = new Date(b.finishedAt).getTime() - new Date(b.startedAt).getTime();
      return durationB - durationA;
    });
  }

  return (
    <Box sx={{ width: 1 }}>
      <Table sx={{ tableLayout: 'fixed' }}>
        <TableBody>
          <TableRow>
            <TableCell sx={leftTableCell}>
              <ActionHistoryItemTimeStamp finishedAt={log.startedAt} startedAt={log.startedAt} />
            </TableCell>
            <TableCell sx={rightTableCell}>
              <LogSummaryDetails log={log} />
            </TableCell>
          </TableRow>

          {history.map((historyItem, index) => (
            <TableRow key={`${index}`}>
              <TableCell sx={leftTableCell}>
                <ActionHistoryItemTimeStamp finishedAt={historyItem.finishedAt} startedAt={historyItem.startedAt} />
              </TableCell>
              <TableCell sx={rightTableCell}>
                {historyItem.act && <AnyActionHistoryItem action={historyItem.act} result={historyItem.res} />}
                {!historyItem.act && <div>No Action</div>}
              </TableCell>
            </TableRow>
          ))}

          <TableRow>
            <TableCell sx={leftTableCell}>
              <ActionHistoryItemTimeStamp finishedAt={log.finishedAt} startedAt={log.finishedAt} />
            </TableCell>
            <TableCell sx={rightTableCell}>
              <LogSummaryReturn log={log} />
            </TableCell>
          </TableRow>

          {log?.logs && (
            <TableRow>
              <TableCell colSpan={2} style={{ width: '100%' }}>
                <div style={{ paddingBottom: '10px' }}>
                  <Typography component="span" variant="h6">
                    Caught console.log events
                  </Typography>
                </div>
                <ConsoleLogViewer logs={log?.logs} />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
};
