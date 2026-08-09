import type { ReactNode } from 'react';

/**
 * The story / test pair, taken from quidproquo-features' tenant scope gate.
 * Kept close to the real source: the point only lands if the test is genuinely
 * this short.
 */

const kw = (text: string) => <span className="tok-kw">{text}</span>;
const fn = (text: string) => <span className="tok-fn">{text}</span>;
const str = (text: string) => <span className="tok-str">{text}</span>;
const cm = (text: string) => <span className="tok-cm">{text}</span>;
const ty = (text: string) => <span className="tok-ty">{text}</span>;

const STORY_LINES: ReactNode[] = [
  <>
    {kw('export function')}* {fn('askTenantResolveRequestScope')}(event) {'{'}
  </>,
  <>
    {'  '}
    {kw('const')} userId = {kw('yield')}* {fn('askResolveUserId')}();
  </>,
  <>
    {'  '}
    {kw('const')} tenantId = {fn('getHeaderValue')}(name, event.headers);
  </>,
  <>&nbsp;</>,
  <>
    {'  '}
    {kw('if')} (!tenantId) {kw('return')} {fn('composePersonalScope')}(userId);
  </>,
  <>&nbsp;</>,
  <>
    {'  '}
    {kw('const')} isMember = {kw('yield')}*
  </>,
  <>
    {'    '}
    {fn('askTenantValidateMembership')}(userId, tenantId);
  </>,
  <>
    {'  '}
    {kw('if')} (!isMember) {'{'}
  </>,
  <>
    {'    '}
    {kw('return')} {kw('yield')}* {fn('askThrowError')}(Forbidden, {str("'…'")}
    );
  </>,
  <>{'  }'}</>,
  <>&nbsp;</>,
  <>
    {'  '}
    {kw('return')} {fn('composeTenantScope')}(tenantId);
  </>,
  <>{'}'}</>,
];

const TEST_LINES: ReactNode[] = [
  <>{cm('// no DI container, no jest.mock, no local dynamo')}</>,
  <>
    {fn('it')}({str("'rejects a tenant the user is not in'")}, () =&gt; {'{'}
  </>,
  <>
    {'  '}
    {kw('const')} run = () =&gt; {fn('runStory')}({fn('askTenantResolve')}
    (event), {'{'}
  </>,
  <>
    {'    '}[{ty('UserDirectoryActionType')}.ReadAccessToken]: {'{'} userId:{' '}
    {str("'u1'")} {'}'},
  </>,
  <>
    {'    '}[{ty('KeyValueStoreActionType')}.Get]: {'{'} tenantIds: [
    {str("'tenant-a'")}] {'}'},
  </>,
  <>{'  });'}</>,
  <>&nbsp;</>,
  <>
    {'  '}
    {fn('expect')}(run).{fn('toThrowError')}(/not a member/);
  </>,
  <>{'});'}</>,
];

const renderCode = (lines: ReactNode[]) =>
  lines.map((line, index) => (
    <span key={index} className="split-line">
      {line}
    </span>
  ));

export function Testing() {
  return (
    <section className="section" id="testing">
      <div className="section__head">
        <p className="section__kicker">testing</p>
        <h2 className="section__title">Tests with nothing to mock</h2>
        <p className="section__sub">
          Stories ask for results by action type, so a test answers by action
          type. No stubbing modules, no dependency injection, no container to
          spin up. The story cannot tell the difference.
        </p>
      </div>

      <div className="split">
        <div className="split__panel">
          <div className="split__panel-head">the story</div>
          <pre className="split__code">
            <code>{renderCode(STORY_LINES)}</code>
          </pre>
        </div>

        <div className="split__panel">
          <div className="split__panel-head">the whole test</div>
          <pre className="split__code">
            <code>{renderCode(TEST_LINES)}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
