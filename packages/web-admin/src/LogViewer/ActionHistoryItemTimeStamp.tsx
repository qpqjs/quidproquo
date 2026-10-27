import { Typography } from '@mui/material';

interface ActionHistoryItemTimeStampProps {
  startedAt: string;
  finishedAt: string;
}

export const ActionHistoryItemTimeStamp = ({ startedAt, finishedAt }: ActionHistoryItemTimeStampProps) => {
  const startDate = new Date(startedAt);
  const endDate = new Date(finishedAt);
  const executionTime = endDate.getTime() - startDate.getTime();

  // Function to format date to include milliseconds
  const formatDateWithMilliseconds = (date: Date) => {
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    const timeString = date.toLocaleTimeString('en-AU', timeOptions);
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
    return `${timeString}.${milliseconds}`;
  };

  return (
    <div>
      <Typography variant="body2">{formatDateWithMilliseconds(startDate)}</Typography>
      <Typography variant="body2">{startDate.toLocaleDateString('en-AU')}</Typography>
      <Typography variant="body2">{`${executionTime} ms`}</Typography>
    </div>
  );
};
