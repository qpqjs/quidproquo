import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * The trace viewer, in miniature.
 *
 * qpq records every story execution as its input plus the ordered history of
 * every action it took. Because a story is deterministic and all impurity is an
 * action, that log replays exactly, and the replay runs under the node
 * inspector so every statement and local can be captured and source-mapped back
 * to the original TypeScript. This section walks a real-shaped trace one step
 * at a time so the annotations land the way they do in qpq-admin.
 */

const kw = (text: string) => <span className="tok-kw">{text}</span>;
const fn = (text: string) => <span className="tok-fn">{text}</span>;
const str = (text: string) => <span className="tok-str">{text}</span>;

type TraceLine = {
  code: ReactNode;
  // what executing this statement put in scope
  note?: string;
  // the outcome of an action whose result is void, so there is no local to show
  effect?: string;
  // the value handed back at a return position
  returns?: string;
  // step ordinal the statement occupies; its annotation appears once the step
  // has been walked past, the way a local only exists after its statement runs
  revealAfter?: number;
};

const LINES: TraceLine[] = [
  {
    code: (
      <>
        {kw('export function')}* {fn('askOnboardUser')}(email) {'{'}
      </>
    ),
  },
  {
    code: (
      <>
        {'  '}
        {kw('const')} userId = {kw('yield')}* {fn('askNewGuid')}();
      </>
    ),
    note: "userId = '8f2c41ab-9d7e-4c02'",
    revealAfter: 1,
  },
  {
    code: (
      <>
        {'  '}
        {kw('const')} plan = {kw('yield')}* {fn('askKeyValueStoreGet')}(
        {str("'plans'")}, {str("'free'")});
      </>
    ),
    note: "plan = { tier: 'free', seats: 1 }",
    revealAfter: 2,
  },
  {
    code: (
      <>
        {'  '}
        {kw('const')} region = {kw('yield')}* {fn('askConfigGetParameter')}(
        {str("'region'")});
      </>
    ),
    note: "region = 'ap-southeast-2'",
    revealAfter: 3,
  },
  { code: <>&nbsp;</> },
  {
    code: (
      <>
        {'  '}
        {kw('yield')}* {fn('askKeyValueStoreUpsert')}({str("'accounts'")}, {'{'}
      </>
    ),
  },
  {
    code: <>{'    '}userId, email, tier: plan.tier, region,</>,
  },
  // the statement closes here, so the upsert's outcome is annotated on this line
  {
    code: <>{'  });'}</>,
    effect: "saved to 'accounts'",
    revealAfter: 4,
  },
  {
    code: (
      <>
        {'  '}
        {kw('yield')}* {fn('askQueueSendMessages')}({str("'welcome'")}, {'{'}{' '}
        userId {'}'});
      </>
    ),
    effect: "1 message sent to 'welcome'",
    revealAfter: 5,
  },
  { code: <>&nbsp;</> },
  {
    code: (
      <>
        {'  '}
        {kw('return')} {'{'} userId, tier: plan.tier {'}'};
      </>
    ),
    returns: "{ userId: '8f2c41ab…', tier: 'free' }",
    revealAfter: 6,
  },
  { code: <>{'}'}</> },
];

// Break positions, not lines: a multi-line call is one statement, so the
// continuation lines of the upsert (6, 7) never get a step of their own, and
// neither do blanks or the closing brace.
const STEPPABLE = [0, 1, 2, 3, 5, 8, 10];

const STEP_MS = 850;
const HOLD_MS = 2600;

export function Replay() {
  // how many steps of the trace have been walked; STEPPABLE.length means done
  const [stepCount, setStepCount] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStepCount(STEPPABLE.length);
      return;
    }

    let timeoutId = 0;

    const scheduleNext = (count: number) => {
      const done = count >= STEPPABLE.length;
      timeoutId = window.setTimeout(
        () => {
          const next = done ? 0 : count + 1;
          setStepCount(next);
          scheduleNext(next);
        },
        done ? HOLD_MS : STEP_MS
      );
    };

    scheduleNext(0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const currentLine = STEPPABLE[Math.min(stepCount, STEPPABLE.length - 1)];
  const finished = stepCount >= STEPPABLE.length;

  return (
    <section className="section" id="replay">
      <div className="section__head">
        <p className="section__kicker">replay</p>
        <h2 className="section__title">Every run is a recording</h2>
        <p className="section__sub">
          A story only becomes impure by yielding an action, so the log of those
          actions is enough to run it again exactly. qpq replays a production
          log under the node inspector and hands you back the source, line by
          line, with the variables.
        </p>
      </div>

      <div className="replay">
        <div className="replay__bar">
          <span className="code-window__dot code-window__dot--red" />
          <span className="code-window__dot code-window__dot--amber" />
          <span className="code-window__dot code-window__dot--green" />
          <span className="code-window__title">onboardUser.story.ts</span>
          <span className="replay__badge">replayed from log</span>
        </div>

        <pre className="replay__code">
          <code>
            {LINES.map((line, index) => {
              const revealed =
                line.revealAfter !== undefined && stepCount > line.revealAfter;
              const active = index === currentLine && !finished;

              return (
                <span
                  key={index}
                  className={`replay-line${active ? ' is-active' : ''}`}
                >
                  <span className="replay-line__text">{line.code}</span>
                  {revealed && line.note && (
                    <span className="replay-line__note">{`// ${line.note}`}</span>
                  )}
                  {revealed && line.effect && (
                    <span className="replay-line__note replay-line__note--effect">
                      {`// ✓ ${line.effect}`}
                    </span>
                  )}
                  {revealed && line.returns && (
                    <span className="replay-line__note replay-line__note--return">
                      {`→ ${line.returns}`}
                    </span>
                  )}
                </span>
              );
            })}
          </code>
        </pre>

        <div className="replay__foot">
          <span className="replay__stat">
            {finished ? STEPPABLE.length : stepCount} / {STEPPABLE.length} steps
          </span>
          <span className="replay__stat">310ms replay</span>
          <span className="replay__stat">source-mapped to TS</span>
          <span className="replay__foot-note">
            no breakpoints, no reproduction, no guessing
          </span>
        </div>
      </div>
    </section>
  );
}
