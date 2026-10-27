import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

import { useErrorsByType } from '../hooks/useErrorsByType';

interface ErrorsByTypeProps {
  logs: any[];
}

export const ErrorsByType = ({ logs }: ErrorsByTypeProps) => {
  const data = useErrorsByType(logs);

  return (
    <>
      <Typography gutterBottom variant="h5">
        Errors by Type
      </Typography>
      <BarChart data={data} height={300} width={1200}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="errorText" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#8884d8" />
      </BarChart>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Error Type</TableCell>
              <TableCell align="right">Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.errorText}>
                <TableCell component="th" scope="row">
                  {row.errorText}
                </TableCell>
                <TableCell align="right">{row.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};
