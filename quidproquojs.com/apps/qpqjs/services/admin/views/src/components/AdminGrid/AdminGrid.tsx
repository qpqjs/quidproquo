import { DataGridColumDefinitions, LoadingSpinner } from '@qpqjs/web-admin';

import { AdminGridProps } from './types/AdminGridProps';
import useStyles from './styles';

export const AdminGrid = <T extends object>({ title = '', loading = false, items, columns, onRowClick }: AdminGridProps<T>) => {
  const styles = useStyles();

  const handleRowClick = (item: T) => {
    if (onRowClick) {
      onRowClick(item);
    }
  };

  const getCellValue = (item: T, column: DataGridColumDefinitions<T>) => {
    if ('field' in column) {
      return item[column.field];
    }
    if ('valueGetter' in column) {
      return column.valueGetter(item);
    }
    return null;
  };

  const totalScale = columns.reduce((acc, c) => acc + (c.widthScale || 0), 0);

  return (
    <div className={styles.container}>
      {title && <div className={styles.title}>{title}</div>}
      {loading && <LoadingSpinner isLoading />}
      {!loading && (
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={styles.headerCell}
                  style={{
                    width: col.widthScale && totalScale ? `${col.widthScale / totalScale}%` : 'auto',
                  }}
                >
                  {col.headerName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? styles.row : styles.alternateRow} onClick={() => handleRowClick(item)}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className={styles.cell}>
                    {col.renderCell ? col.renderCell(item) : getCellValue(item, col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
