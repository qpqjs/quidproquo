import { ViewsInfo } from './ViewsInfo';

export type ViewsContext = {
  root: string;
  appName: string;
  self: ViewsInfo;
  // Every OTHER views project in the app.
  siblings: ViewsInfo[];
};
