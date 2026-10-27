import { memo, useMemo } from 'react';
// TODO: Move this to global configs.
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en.json';
import ReactTimeAgo from 'react-time-ago';
TimeAgo.addDefaultLocale(en);

const LastSeen = (props: any) => {
  const date = useMemo(() => new Date(props.isoTime), [props.isoTime]);
  return <ReactTimeAgo date={date} locale="en-US" />;
};

export default memo(LastSeen);
