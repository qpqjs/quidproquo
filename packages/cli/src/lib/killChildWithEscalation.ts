// Stopping the dev server child, with a hard backstop.
//
// The dev server now runs an ordered shutdown on SIGTERM (drain in-flight
// work, then checkpoint the stores) instead of dying instantly. That is the
// point - it is what stops a save-triggered restart eating a queue message
// mid-story - but it means a bare `child.kill()` followed by waiting for exit
// can now wait forever if a teardown wedges. Without escalation this would
// trade a data-loss bug for a hung-restart bug, and the next launch would find
// its ports still held.
import { ChildProcess } from 'child_process';

// Above the dev server's 5s worst-case shutdown budget, below docker's 10s
// default stop grace, so a container stop still exits cleanly rather than
// being SIGKILLed by docker mid-escalation.
const DEFAULT_KILL_GRACE_MS = 6000;

/**
 * SIGTERM the child, resolve once it has actually exited, and SIGKILL it if it
 * has not gone within the grace window.
 *
 * Resolves rather than rejects on escalation: the caller's next move is the
 * same either way (start the replacement), and a rejection would only give
 * every call site a catch to write.
 */
export const killChildWithEscalation = (child: ChildProcess, graceMs = DEFAULT_KILL_GRACE_MS): Promise<void> => {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      console.warn(`Dev server did not exit within ${graceMs}ms — sending SIGKILL.`);
      child.kill('SIGKILL');
    }, graceMs);

    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });

    child.kill('SIGTERM');
  });
};
