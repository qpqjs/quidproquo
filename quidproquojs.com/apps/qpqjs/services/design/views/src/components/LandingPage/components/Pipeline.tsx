type Stage = {
  step: string;
  title: string;
  body: string;
  code: string;
};

const STAGES: Stage[] = [
  {
    step: '01',
    title: 'Story yields an action',
    body: 'Your generator pauses and hands the runtime a plain, typed description of what it needs.',
    code: 'yield* askFileWriteContents(...)',
  },
  {
    step: '02',
    title: 'Runtime routes it',
    body: 'The runtime looks up the processor registered for that action type on this platform.',
    code: 'FileWriteContents → processor',
  },
  {
    step: '03',
    title: 'Processor executes',
    body: 'On Lambda that means S3. On Node, the filesystem. The result flows back into your story.',
    code: 's3.putObject(...) → resume story',
  },
];

export function Pipeline() {
  return (
    <section className="section" id="pipeline">
      <div className="section__head">
        <p className="section__kicker">how it runs</p>
        <h2 className="section__title">From yield to production</h2>
        <p className="section__sub">
          A story never touches a platform API. Actions travel to the runtime,
          and processors do the work.
        </p>
      </div>

      <div className="pipeline">
        {STAGES.map((stage) => (
          <article key={stage.step} className="pipeline__stage">
            <span className="pipeline__step">{stage.step}</span>
            <div>
              <h3>{stage.title}</h3>
              <p>{stage.body}</p>
            </div>
            <code className="pipeline__code">{stage.code}</code>
          </article>
        ))}
      </div>
    </section>
  );
}
