// The log-search filter set — mirrors the URL query params the admin has always
// used (the URL is now a projection of these, seeded back in at session start).
export type AdminSearchParams = {
  runtimeType: string;
  service: string;
  startIsoDateTime: string;
  endIsoDateTime: string;
  user: string;
  info: string;
  msg: string;
  error: string;
  deep: string;
  logLevel: string;
};
