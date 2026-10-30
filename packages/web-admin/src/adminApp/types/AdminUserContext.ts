// Who is logged in, provided by AdminAppProvider from the auth runtime so
// session stories (which run in the admin runtime) can read it.
export type AdminUserContext = {
  username: string;
};
