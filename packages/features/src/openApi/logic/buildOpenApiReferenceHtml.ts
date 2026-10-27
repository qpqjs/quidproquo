// A single page that loads Scalar's reference UI from a CDN and points it at the
// document next to it. The document url is worked out in the browser from the
// page's own location rather than the request path, because the dev server mounts
// each service under /api/<service> and strips that prefix before the story runs.
export const buildOpenApiReferenceHtml = (title: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body>
    <script id="api-reference"></script>
    <script>
      document.getElementById('api-reference').dataset.url = location.pathname.replace(/\\/$/, '') + '/openapi.json';
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;
