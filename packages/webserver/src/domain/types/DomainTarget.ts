/** The part of a DomainScope a caller chooses; root, environment and feature come from config. */
export type DomainTarget = {
  service?: string;
  subdomain?: string;
};
