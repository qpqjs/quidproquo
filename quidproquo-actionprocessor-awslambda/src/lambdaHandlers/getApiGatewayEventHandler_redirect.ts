import { APIGatewayEvent, Context } from 'aws-lambda';

/**
 * Standalone 301 handler for subdomain redirects. The CDK redirect construct resolves the
 * target at synth and JSON-encodes it onto the function env: `redirectBaseUrl` (absolute,
 * no trailing path) and `appendPath` (true for domain redirects, which keep the request
 * path; false for an explicit absolute url, which redirects as-is). No qpq runtime involved.
 */
const apiGatewayEventHandler_redirect = async (event: APIGatewayEvent, context: Context) => {
  const redirectBaseUrl: string = JSON.parse(process.env.redirectBaseUrl as string);
  const appendPath: boolean = JSON.parse((process.env.appendPath as string | undefined) || 'false');

  let redirectUrl = appendPath ? `${redirectBaseUrl}${event.path}` : redirectBaseUrl;

  const queryParams = event.queryStringParameters;
  if (queryParams) {
    const queryString = Object.entries(queryParams)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`)
      .join('&');
    redirectUrl += `?${queryString}`;
  }

  return {
    statusCode: 301,
    body: '',
    headers: {
      Location: redirectUrl,
    },
  };
};

export const getApiGatewayEventHandler_redirect = () => apiGatewayEventHandler_redirect;
