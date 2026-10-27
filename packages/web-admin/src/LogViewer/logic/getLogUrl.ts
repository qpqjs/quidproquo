import { encodeLogPathSegment } from './encodeLogPathSegment';

export const getLogUrl = (logCorrelation: string): string => {
  if (!logCorrelation) {
    return '';
  }

  return `/log/downloadUrl/${encodeLogPathSegment(logCorrelation)}`;
};
