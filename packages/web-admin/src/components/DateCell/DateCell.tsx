import Typography from '@mui/material/Typography';

import LastSeen from '../LastSeen/LastSeen';

type DateCellProps =
  | {
      isoDateTime: string;
    }
  | {
      unixTimestampMs: number;
    };

export const DateCell: React.FC<DateCellProps> = (props: DateCellProps) => {
  let date = 'isoDateTime' in props ? new Date(props.isoDateTime) : new Date(props.unixTimestampMs);

  const formattedTime = date.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const formattedDate = date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Typography component="span" variant="body2">
        {formattedDate} {formattedTime}
      </Typography>
      <LastSeen isoTime={date.toISOString()} timeStyle="twitter" />
    </div>
  );
};
