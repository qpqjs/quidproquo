import type { ReactNode } from 'react';

const kw = (text: string) => <span className="tok-kw">{text}</span>;
const fn = (text: string) => <span className="tok-fn">{text}</span>;
const str = (text: string) => <span className="tok-str">{text}</span>;
const ty = (text: string) => <span className="tok-ty">{text}</span>;
const cm = (text: string) => <span className="tok-cm">{text}</span>;
const pr = (text: string) => <span className="tok-pr">{text}</span>;

const LINES: ReactNode[] = [
  <>{cm('// pure business logic, no infrastructure')}</>,
  <>
    {kw('export function')}* {fn('askSendWelcomeEmail')}(
  </>,
  <>
    {'  '}userId: {ty('string')},
  </>,
  <>) {'{'}</>,
  <>
    {'  '}
    {kw('const')} user = {kw('yield')}* {fn('askUserDirectoryGetUser')}(userId);
  </>,
  <>&nbsp;</>,
  <>
    {'  '}
    {kw('yield')}* {fn('askQueueSendMessage')}({str("'email'")}, {'{'}
  </>,
  <>
    {'    '}
    {pr('to')}: user.email,
  </>,
  <>
    {'    '}
    {pr('template')}: {str("'welcome'")},
  </>,
  <>{'  });'}</>,
  <>&nbsp;</>,
  <>
    {'  '}
    {kw('yield')}* {fn('askEventBusPublish')}({str("'welcomed'")}, {'{'} userId{' '}
    {'}'});
  </>,
  <>&nbsp;</>,
  <>
    {'  '}
    {kw('return')} user;
  </>,
  <>{'}'}</>,
];

export function CodeWindow() {
  return (
    <div className="code-window">
      <div className="code-window__bar">
        <span className="code-window__dot code-window__dot--red" />
        <span className="code-window__dot code-window__dot--amber" />
        <span className="code-window__dot code-window__dot--green" />
        <span className="code-window__title">sendWelcomeEmail.story.ts</span>
      </div>
      <pre className="code-window__body">
        <code>
          {LINES.map((line, index) => (
            <span key={index} className="code-line">
              <span className="code-line__num">{index + 1}</span>
              <span className="code-line__text">{line}</span>
            </span>
          ))}
        </code>
      </pre>
      <div className="code-window__foot">
        <span className="code-window__runs">runs unchanged on</span>
        <span className="runtime-chip">λ aws lambda</span>
        <span className="runtime-chip">⬢ node</span>
        <span className="runtime-chip">◍ browser</span>
      </div>
    </div>
  );
}
