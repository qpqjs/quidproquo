import { useMemo } from 'react';
import { GridColDef } from '@mui/x-data-grid';

export const useLogViewGridColumns = (getColumns: () => GridColDef[]) => {
  const columns = useMemo(() => getColumns(), [getColumns]);
  return columns;
};
