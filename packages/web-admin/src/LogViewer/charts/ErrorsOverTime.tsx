import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { Typography } from '@mui/material';

import { useErrorsOverTime } from '../hooks/useErrorsOverTime';
import { SearchParams } from '../types';

interface ErrorsOverTimeProps {
  logs: any[];
  searchParams: SearchParams;
}

export const ErrorsOverTime = ({ logs, searchParams }: ErrorsOverTimeProps) => {
  const data = useErrorsOverTime(logs, searchParams);

  return (
    <>
      <Typography gutterBottom variant="h5">
        Errors Over Time
      </Typography>
      <LineChart data={data} height={300} width={1200}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line activeDot={{ r: 8 }} dataKey="errors" stroke="#8884d8" type="monotone" />
      </LineChart>
    </>
  );
};
