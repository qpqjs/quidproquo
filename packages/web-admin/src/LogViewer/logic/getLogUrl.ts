export const getLogUrl = (logCorrelation: string): string => {
  if (!logCorrelation) {
    return '';
  }

  return `/log/downloadUrl/${encodeURIComponent(logCorrelation)}`;
};
