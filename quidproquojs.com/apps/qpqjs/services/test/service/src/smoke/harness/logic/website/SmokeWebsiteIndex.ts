import { HTTPNetworkResponse } from 'quidproquo';

/** The website's root url and its index page response, as a probe starts from them. */
export type SmokeWebsiteIndex = {
  websiteUrl: string;
  index: HTTPNetworkResponse<string>;
};
