import { CodeWindow } from './CodeWindow';
import { InstallChip } from './InstallChip';
import { NavBar } from './NavBar';

export function Hero() {
  return (
    <>
      <NavBar />

      <section className="hero" id="top">
        <div aria-hidden="true" className="hero__grid" />
        <div aria-hidden="true" className="hero__glow" />

        <div className="hero__inner">
          <p className="hero__kicker">
            functional · action-based · typescript
          </p>

          <h1 className="hero__title">
            Write pure stories.
            <br />
            <span className="hero__title-dim">Run them anywhere.</span>
          </h1>

          <p className="hero__sub">
            Business logic is a generator that yields typed actions. The runtime
            decides how each one executes: Lambda in production, Node on your
            machine, the browser in your app.
          </p>

          <div className="hero__cta">
            <InstallChip />
            <a className="btn btn--ghost" href="#loop">
              See how it works
              <span className="btn__arrow">→</span>
            </a>
          </div>

          <p className="hero__meta">
            <span>MIT licensed</span>
            <span>zero side effects in your logic</span>
            <span>deploys itself with CDK</span>
          </p>
        </div>

        <div className="hero__panel">
          <CodeWindow />
        </div>
      </section>
    </>
  );
}
