import { LogMetadata } from 'quidproquo-features';

import LinearProgress from '@mui/material/LinearProgress';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowClassNameParams } from '@mui/x-data-grid';

import { CorrelationOpenSource, getSearchProgress, logSearchKey, useAdminApp, useSessionState, useVolatileState } from '../adminApp';
import { DataGridPagination } from '../components/DataGridPagination/DataGridPagination';
import { DateCell } from '../components/DateCell/DateCell';
import { LogDialog } from './LogDialog';

const formatTime = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  const sec = ms / 1000;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  const min = sec / 60;
  if (min < 60) return `${min.toFixed(1)}m`;
  const hr = min / 60;
  if (hr < 24) return `${hr.toFixed(1)}h`;
  const day = hr / 24;
  return `${day.toFixed(1)}d`;
};

const columns: GridColDef[] = [
  {
    field: 'startedAt',
    headerName: 'Started at',
    flex: 1,
    renderCell: (params: GridRenderCellParams) => <DateCell isoDateTime={params.value} />,
  },
  { field: 'moduleName', headerName: 'Service', flex: 1 },
  { field: 'runtimeType', headerName: 'Type', flex: 1 },
  { field: 'generic', headerName: 'Info', flex: 3 },
  { field: 'error', headerName: 'Error', flex: 4 },
  { field: 'userInfo', headerName: 'User', flex: 1.5 },
  {
    field: 'executionTimeMs',
    headerName: 'Execution Time',
    flex: 1,
    renderCell: (params: GridRenderCellParams) => <>{formatTime(params.value)}</>,
    sortComparator: (v1, v2) => Number(v1) - Number(v2),
  },
];

type LogMetadataGridProps = {
  logs: LogMetadata[];
  isLoading: boolean;
};

export const LogMetadataGrid = ({ logs, isLoading }: LogMetadataGridProps) => {
  const [api] = useAdminApp();
  const session = useSessionState();
  const volatile = useVolatileState();

  const searchProgress = getSearchProgress(volatile.logResults[logSearchKey(session.search)]);
  const selectedLogCorrelation = session.openCorrelation ?? '';

  const onRowClick = ({ row }: { row: { correlation: string } }) => api.applyCorrelationOpened(row.correlation, CorrelationOpenSource.grid);
  const clearSelectedLogCorrelation = () => api.applyCorrelationClosed();
  const setSelectedLogCorrelation = (correlation: string) => api.applyCorrelationOpened(correlation, CorrelationOpenSource.tree);

  const getRowClassName = (params: GridRowClassNameParams) => {
    return params.row.checked ? 'greenRow' : '';
  };

  return (
    <>
      <style>
        {`
          .greenRow {
            background-color: #eaffea;
          }
        `}
      </style>
      <DataGrid
        autoPageSize
        columns={columns}
        components={{
          Pagination: DataGridPagination,
          LoadingOverlay: () => <LinearProgress value={searchProgress} variant="determinate" />,
        }}
        getRowClassName={getRowClassName}
        loading={isLoading}
        onRowClick={onRowClick}
        rows={logs.map((log) => ({ ...log, id: log.correlation }))}
      />
      <LogDialog
        handleClose={clearSelectedLogCorrelation}
        logCorrelation={selectedLogCorrelation}
        open={!!selectedLogCorrelation}
        setSelectedLogCorrelation={setSelectedLogCorrelation}
        storyResultMetadatas={logs}
      />
    </>
  );
};
