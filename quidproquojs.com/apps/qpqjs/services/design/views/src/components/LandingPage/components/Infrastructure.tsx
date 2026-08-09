import type { ReactNode } from 'react';

/**
 * The config on the left is (trimmed from) this site's own
 * shell/service/src/infrastructure.ts, and the resources on the right are what
 * the CDK package actually builds from it. Using the page's own deployment as
 * the example is the whole point of the section.
 */

const kw = (text: string) => <span className="tok-kw">{text}</span>;
const fn = (text: string) => <span className="tok-fn">{text}</span>;
const str = (text: string) => <span className="tok-str">{text}</span>;
const pr = (text: string) => <span className="tok-pr">{text}</span>;

const CONFIG_LINES: ReactNode[] = [
  <>{kw('export default')} [</>,
  <>
    {'  '}
    {fn('defineQpqjsService')}(ServiceEnum.Shell, __dirname, dist),
  </>,
  <>&nbsp;</>,
  <>
    {'  '}
    {fn('defineStorageDrive')}({str("'website'")}),
  </>,
  <>
    {'  '}
    {fn('defineWebEntry')}({str("'website'")}, {'{'}
  </>,
  <>
    {'    '}
    {pr('domain')}: {'{'} onRootDomain: {kw('true')}, rootDomain: QPQJS_DOMAIN{' '}
    {'}'},
  </>,
  <>{'  }),'}</>,
  <>&nbsp;</>,
  <>
    {'  '}
    {fn('defineWebEntry')}({str("'docs'")}, {'{'}
  </>,
  <>
    {'    '}
    {pr('domain')}: {'{'} subDomainName: {str("'docs'")}, … {'}'},
  </>,
  <>{'  }),'}</>,
  <>];</>,
];

type Resource = {
  name: string;
  detail: string;
};

const RESOURCES: Resource[] = [
  { name: 'S3 buckets', detail: 'origin storage for each web entry' },
  { name: 'CloudFront distributions', detail: 'one per entry, cache policies' },
  { name: 'ACM certificate', detail: 'resolved from the apex zone' },
  { name: 'Route 53 A records', detail: 'alias targets per subdomain' },
  { name: 'Response headers policy', detail: 'security headers, CORS' },
  { name: 'Lambda@Edge', detail: 'SEO viewer + origin request' },
];

type Mapping = {
  define: string;
  produces: string;
};

const MAPPINGS: Mapping[] = [
  { define: 'defineQueue', produces: 'SQS queue + DLQ + Lambda event source' },
  {
    define: 'defineKeyValueStore',
    produces: 'DynamoDB table, keys and streams',
  },
  {
    define: 'defineUserDirectory',
    produces: 'Cognito pool, clients, triggers',
  },
];

export function Infrastructure() {
  return (
    <section className="section" id="infra">
      <div className="section__head">
        <p className="section__kicker">deploys</p>
        <h2 className="section__title">The config is the infrastructure</h2>
        <p className="section__sub">
          You describe what the service has, not how to build it. The CDK
          package turns that same config into real AWS resources. This is the
          config that deployed the page you are reading.
        </p>
      </div>

      <div className="split split--infra">
        <div className="split__panel">
          <div className="split__panel-head">infrastructure.ts</div>
          <pre className="split__code">
            <code>
              {CONFIG_LINES.map((line, index) => (
                <span key={index} className="split-line">
                  {line}
                </span>
              ))}
            </code>
          </pre>
        </div>

        <div className="split__panel">
          <div className="split__panel-head">what gets built</div>
          <ul className="resource-list">
            {RESOURCES.map((resource) => (
              <li key={resource.name} className="resource">
                <span className="resource__name">{resource.name}</span>
                <span className="resource__detail">{resource.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mapping-row">
        {MAPPINGS.map((mapping) => (
          <div key={mapping.define} className="mapping">
            <code className="mapping__define">{mapping.define}</code>
            <span className="mapping__produces">{mapping.produces}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
