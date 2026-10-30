import { createUseStyles } from 'react-jss';

export default createUseStyles(
  {
    container: {
      padding: '16px',
      backgroundColor: '#333',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      marginBottom: '16px',
    },
    title: {
      fontSize: '24px',
      marginBottom: '16px',
      color: '#fff',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    headerCell: {
      padding: '8px',
      backgroundColor: '#444',
      color: '#fff',
      textAlign: 'left',
      borderBottom: '2px solid #333',
    },
    cell: {
      padding: '8px',
      borderBottom: '1px solid #555',
      color: '#fff',
    },
    row: {
      backgroundColor: '#444',
    },
    alternateRow: {
      backgroundColor: '#555',
    },
  },
  { name: 'adminGrid' },
);
