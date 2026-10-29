/** A receiver the dev server can deliver to: mail for any address at `hosts` lands in its drive. */
export type LocalEmailInbox = {
  serviceName: string;
  storageDriveName: string;
  hosts: string[];
};
