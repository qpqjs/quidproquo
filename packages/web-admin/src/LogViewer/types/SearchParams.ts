export interface SearchParams {
  runtimeType: string;
  startIsoDateTime: string;
  endIsoDateTime: string;

  serviceFilter: string;
  infoFilter: string;
  errorFilter: string;
  userFilter: string;
  deep: string;

  onlyErrors: boolean;
}
