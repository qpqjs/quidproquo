import { DataGrid, GridColDef, GridRenderCellParams, GridRowParams } from '@mui/x-data-grid';

import { DataGridPagination } from '../../components/DataGridPagination/DataGridPagination';
import { DateCell } from '../../components/DateCell/DateCell';
import { ActionSearchResultRow } from '../hooks/useActionSearch';
import { ActionSearchView } from '../types/ActionSearchView';

const dateColumn = (field: string, headerName: string): GridColDef => ({
  field,
  headerName,
  flex: 1,
  // Guarded so one row with a missing date can't crash the whole grid
  renderCell: (params: GridRenderCellParams) => (params.value ? <DateCell isoDateTime={params.value} /> : null),
});

const buildColumns = (view: ActionSearchView): GridColDef[] => {
  // Lookup-only fields (e.g. email recipient) have no row attribute to show
  const fieldColumns: GridColDef[] = view.fields
    .filter((field) => !field.hasLookup)
    .map((field) => ({ field: field.name, headerName: field.label, flex: 1 }));

  if (view.kind === 'action') {
    return [
      dateColumn('startedAt', 'Started at'),
      { field: 'moduleName', headerName: 'Service', flex: 1 },
      ...fieldColumns,
      { field: 'error', headerName: 'Error', flex: 2 },
    ];
  }

  return [dateColumn('createdAt', 'Created at'), ...fieldColumns];
};

const getRowId = (view: ActionSearchView, row: ActionSearchResultRow): string =>
  view.kind === 'action' ? `${row.correlation}#${row.actionIndex}` : String(row.linkKey);

type ActionSearchGridProps = {
  view: ActionSearchView;
  rows: ActionSearchResultRow[];
  isLoading: boolean;
  onRowClick: (row: ActionSearchResultRow) => void;
};

export const ActionSearchGrid = ({ view, rows, isLoading, onRowClick }: ActionSearchGridProps) => {
  const columns = buildColumns(view);

  const handleRowClick = (params: GridRowParams) => onRowClick(params.row as ActionSearchResultRow);

  return (
    <DataGrid
      autoPageSize
      columns={columns}
      components={{
        Pagination: DataGridPagination,
      }}
      loading={isLoading}
      onRowClick={handleRowClick}
      rows={rows.map((row) => ({ ...row, id: getRowId(view, row) }))}
    />
  );
};
