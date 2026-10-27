export type CloudflarePageInfo = {
  page: number;
  per_page: number;
  total_pages: number;
  count: number;
  total_count: number;
};

export type CloudflareError = {
  code: string;
  message: string;
};

export type CloudflareResponse<T> = {
  result: T[];
  result_info: CloudflarePageInfo;
  success: boolean;
  errors: CloudflareError[];
  messages: string[]; // assuming messages are strings
};

export type CloudflareZone = {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  type: string;
  development_mode: number;
  name_servers: string[];
  original_name_servers: string[];
  original_registrar: string;
  original_dnshost: null | string; // assuming this can be a string or null
  modified_on: string;
  created_on: string;
  activated_on: string;
};

export type CloudflareDNSRecord = {
  id: string;
  type: 'CNAME' | 'A';
  name: string;
  content: string;
  ttl: number;
  proxied?: boolean;
};
