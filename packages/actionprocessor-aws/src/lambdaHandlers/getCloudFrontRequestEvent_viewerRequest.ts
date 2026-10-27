import { qpqHeaderIsBot } from 'quidproquo-webserver';

import { CloudFrontRequestEvent, Context } from 'aws-lambda';

// Bot detection for integrating Prerender; the app business logic decides what to
// do with the flag. For more info: https://docs.prerender.io/docs/apache-2
const botUserAgentPattern =
  /googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest\/0\.|pinterestbot|slackbot|vkShare|W3C_Validator|whatsapp|redditbot|applebot|flipboard|tumblr|bitlybot|skypeuripreview|nuzzel|discordbot|google page speed|qwantify|bitrix link preview|xing-contenttabreceiver|google-inspectiontool|chrome-lighthouse|telegrambot/i;

const viewerRequestEventHandler = async (event: CloudFrontRequestEvent, context: Context) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers || {};

  const userAgent = headers['user-agent']?.[0]?.value || 'unknown';
  const isBot = botUserAgentPattern.test(userAgent);

  return {
    ...request,
    headers: {
      ...request.headers,
      [qpqHeaderIsBot]: [
        {
          key: qpqHeaderIsBot,
          value: isBot ? 'true' : 'false',
        },
      ],
    },
  };
};

export const getCloudFrontRequestEvent_viewerRequest = () => viewerRequestEventHandler;
