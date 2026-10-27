// A tenant's brand colours. Optional on the tenant (a tenant may never set
// them — the site falls back to its own default pair), but when set, both
// primary and secondary are required together: the frontend expands each into a
// full shade ramp, so a half-set pair has no sensible meaning.
export type TenantBrandColors = {
  primary: string;
  secondary: string;
};
