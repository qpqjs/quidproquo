import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * A self-playing visualization of the generator round-trip: the story yields
 * an action, a packet carries it through the runtime hub to an infrastructure
 * processor, and the result travels back into the paused generator, which
 * then advances to its next yield.
 *
 * Connector paths are measured from the real DOM (code line → hub → node) and
 * the packet is driven imperatively along them with getPointAtLength, so the
 * diagram stays glued together at any width.
 */

enum Phase {
  out = 'out',
  process = 'process',
  back = 'back',
  settle = 'settle',
  done = 'done',
}

type LoopStep = {
  lineIndex: number;
  action: string;
  result: string;
  platform: string;
  processor: string;
};

const STEPS: LoopStep[] = [
  {
    lineIndex: 1,
    action: 'KeyValueStoreGet',
    result: 'order',
    platform: 'DynamoDB',
    processor: 'keyValueStore',
  },
  {
    lineIndex: 2,
    action: 'PdfRender',
    result: 'receipt',
    platform: 'Headless Chrome',
    processor: 'custom action',
  },
  {
    lineIndex: 3,
    action: 'FileWriteTextContents',
    result: 'saved',
    platform: 'S3',
    processor: 'file',
  },
];

const DURATIONS: Record<Phase, number> = {
  [Phase.out]: 1100,
  [Phase.process]: 850,
  [Phase.back]: 1100,
  [Phase.settle]: 500,
  [Phase.done]: 1800,
};

const kw = (text: string) => <span className="tok-kw">{text}</span>;
const fn = (text: string) => <span className="tok-fn">{text}</span>;

const CODE_LINES: ReactNode[] = [
  <>
    {kw('export function')}* {fn('askProcessOrder')}(id) {'{'}
  </>,
  <>
    {'  '}
    {kw('const')} order = {kw('yield')}* {fn('askKeyValueStoreGet')}(id);
  </>,
  <>
    {'  '}
    {kw('const')} receipt = {kw('yield')}* {fn('askPdfRender')}(order);
  </>,
  <>
    {'  '}
    {kw('yield')}* {fn('askFileWriteTextContents')}(receipt);
  </>,
  <>
    {'  '}
    {kw('return')} receipt;
  </>,
  <>{'}'}</>,
];

const RETURN_LINE = 4;

type View = {
  step: number;
  phase: Phase;
  completed: boolean[];
};

export function YieldLoop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const packetRef = useRef<SVGGElement>(null);

  const [paths, setPaths] = useState<string[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View>({
    step: 0,
    phase: Phase.out,
    completed: STEPS.map(() => false),
  });

  // measure connector paths from the live layout
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const card = cardRef.current;
      const hub = hubRef.current;
      if (!card || !hub) return;

      const c = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const hubRect = hub.getBoundingClientRect();
      const hx = hubRect.left + hubRect.width / 2 - c.left;
      const hy = hubRect.top + hubRect.height / 2 - c.top;

      const next = STEPS.map((step, index) => {
        const line = lineRefs.current[step.lineIndex];
        const node = nodeRefs.current[index];
        if (!line || !node) return '';
        const lineRect = line.getBoundingClientRect();
        const nodeRect = node.getBoundingClientRect();
        const ax = cardRect.right - c.left + 2;
        const ay = lineRect.top + lineRect.height / 2 - c.top;
        const bx = nodeRect.left - c.left - 2;
        const by = nodeRect.top + nodeRect.height / 2 - c.top;
        return `M ${ax} ${ay} Q ${(ax + hx) / 2} ${ay}, ${hx} ${hy} Q ${(hx + bx) / 2} ${by}, ${bx} ${by}`;
      });

      setPaths(next);
      setSize({ w: c.width, h: c.height });
    };

    measure();
    document.fonts?.ready.then(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // drive the animation timeline
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setView({ step: 0, phase: Phase.done, completed: STEPS.map(() => true) });
      return;
    }

    let rafId = 0;
    let last = performance.now();
    let elapsed = 0;
    let step = 0;
    let phase = Phase.out;

    const placePacket = (t: number) => {
      const packet = packetRef.current;
      const path = pathRefs.current[step];
      if (!packet || !path) return;
      const total = path.getTotalLength();
      if (total === 0) return;
      const point = path.getPointAtLength(total * Math.min(1, Math.max(0, t)));
      packet.setAttribute('transform', `translate(${point.x}, ${point.y})`);
    };

    const setPacketVisible = (visible: boolean) => {
      packetRef.current?.setAttribute('opacity', visible ? '1' : '0');
    };

    const commit = () => {
      setView({
        step,
        phase,
        completed: STEPS.map(
          (_, index) =>
            index < step || (index === step && phase === Phase.settle)
        ),
      });
    };

    const advance = () => {
      if (phase === Phase.out) phase = Phase.process;
      else if (phase === Phase.process) phase = Phase.back;
      else if (phase === Phase.back) phase = Phase.settle;
      else if (phase === Phase.settle) {
        if (step < STEPS.length - 1) {
          step += 1;
          phase = Phase.out;
        } else {
          phase = Phase.done;
        }
      } else {
        step = 0;
        phase = Phase.out;
      }
      commit();
    };

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min(now - last, 100);
      last = now;
      elapsed += dt;

      if (phase === Phase.out) {
        setPacketVisible(true);
        placePacket(elapsed / DURATIONS[Phase.out]);
      } else if (phase === Phase.back) {
        setPacketVisible(true);
        placePacket(1 - elapsed / DURATIONS[Phase.back]);
      } else if (phase === Phase.process) {
        placePacket(1);
      } else {
        setPacketVisible(false);
      }

      if (elapsed >= DURATIONS[phase]) {
        elapsed = 0;
        advance();
      }
    };

    commit();
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const { step, phase, completed } = view;
  const active = STEPS[step];
  const returning = phase === Phase.back;
  const hubMessage =
    phase === Phase.done
      ? 'story complete'
      : returning
        ? `⟵ ${active.result}`
        : `${active.action} ⟶`;

  return (
    <section className="section" id="loop">
      <div className="section__head">
        <p className="section__kicker">the loop</p>
        <h2 className="section__title">Yield out. Flow back.</h2>
        <p className="section__sub">
          A story is a paused conversation with the runtime: it yields an
          action, the infrastructure does the work, and the result resumes the
          generator right where it left off.
        </p>
      </div>

      <div ref={containerRef} className="loop">
        <svg
          aria-hidden="true"
          className="loop__wires"
          height={size.h}
          width={size.w}
        >
          {paths.map((d, index) => (
            <path
              key={index}
              ref={(el) => {
                pathRefs.current[index] = el;
              }}
              className={`loop__wire${index === step && phase !== Phase.done ? ' is-active' : ''}${
                index === step && returning ? ' is-returning' : ''
              }`}
              d={d}
            />
          ))}
          <g
            ref={packetRef}
            className={`loop__packet${returning ? ' is-returning' : ''}`}
            opacity="0"
          >
            <circle className="loop__packet-halo" r="7" />
            <circle className="loop__packet-core" r="2.8" />
          </g>
        </svg>

        <div ref={cardRef} className="loop__card">
          <div className="loop__card-bar">
            <span className="code-window__dot code-window__dot--red" />
            <span className="code-window__dot code-window__dot--amber" />
            <span className="code-window__dot code-window__dot--green" />
            <span className="code-window__title">processOrder.story.ts</span>
          </div>
          <pre className="loop__code">
            <code>
              {CODE_LINES.map((line, index) => {
                const stepIndex = STEPS.findIndex((s) => s.lineIndex === index);
                const isActive =
                  phase === Phase.done
                    ? index === RETURN_LINE
                    : stepIndex === step && stepIndex !== -1;
                const isDone = stepIndex !== -1 && completed[stepIndex];
                return (
                  <span
                    key={index}
                    className={`loop-line${isActive ? ' is-active' : ''}`}
                  >
                    <span
                      ref={(el) => {
                        lineRefs.current[index] = el;
                      }}
                      className="loop-line__text"
                    >
                      {line}
                    </span>
                    {isDone && stepIndex !== -1 && (
                      <span className="loop-line__result">
                        ⟵ {STEPS[stepIndex].result}
                      </span>
                    )}
                  </span>
                );
              })}
            </code>
          </pre>
          <div className="loop__card-foot">generator paused at yield…</div>
        </div>

        <div className="loop__hub-zone">
          <div className={`loop__hub-msg${returning ? ' is-returning' : ''}`}>
            {hubMessage}
          </div>
          <div
            ref={hubRef}
            className={`loop__hub${phase !== Phase.done ? ' is-active' : ''}`}
          >
            <span className="loop__hub-ring" />
            <span className="loop__hub-core" />
          </div>
          <div className="loop__hub-label">qpq runtime</div>
        </div>

        <div className="loop__nodes">
          {STEPS.map((s, index) => (
            <div
              key={s.action}
              ref={(el) => {
                nodeRefs.current[index] = el;
              }}
              className={`loop-node${index === step && phase === Phase.process ? ' is-active' : ''}`}
            >
              <span className="loop-node__platform">{s.platform}</span>
              <span className="loop-node__sub">{s.processor} processor</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
