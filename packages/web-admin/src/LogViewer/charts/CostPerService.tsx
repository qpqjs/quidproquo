import { useMemo } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

const COST_PER_MS = 0.0000000167;

interface CostPerServiceProps {
  logs: any[];
}

export const CostPerService = ({ logs }: CostPerServiceProps) => {
  const data = useMemo(() => {
    const serviceData: Record<string, { executions: number; runtime: number }> = {};

    logs.forEach((log) => {
      if (log.runtimeType !== 'EXECUTE_STORY') {
        const service = log.moduleName;
        const runtime = log.executionTimeMs;

        if (!serviceData[service]) {
          serviceData[service] = { executions: 0, runtime: 0 };
        }

        serviceData[service].executions++;
        serviceData[service].runtime += runtime;
      }
    });

    return Object.entries(serviceData)
      .map(([service, data]) => ({
        service,
        executions: data.executions,
        runtime: data.runtime,
        cost: data.runtime * COST_PER_MS,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [logs]);

  return (
    <>
      <Typography gutterBottom variant="h5">
        Cost per Service
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Service</TableCell>
              <TableCell align="right">Executions</TableCell>
              <TableCell align="right">Runtime (ms)</TableCell>
              <TableCell align="right">Cost ($)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.service}>
                <TableCell component="th" scope="row">
                  {row.service}
                </TableCell>
                <TableCell align="right">{row.executions}</TableCell>
                <TableCell align="right">{row.runtime}</TableCell>
                <TableCell align="right">{row.cost.toFixed(8)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};
