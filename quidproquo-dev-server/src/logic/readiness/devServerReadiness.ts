// Whether every plugin has finished starting.
//
// A port being open is NOT this: the api plugin binds 8080 partway through the
// start sequence, so a caller that waits for a TCP connect can be talking to a
// server whose queue, stores or stream handlers are not up yet. That window is
// small and entirely reproducible under CI load, which is the worst kind of
// flake to chase. So the dev server says when it is ready, rather than the
// caller guessing.
//
// A process has exactly one readiness, hence the module state.
const state = {
  ready: false,
};

export const markDevServerReady = (): void => {
  state.ready = true;
};

export const isDevServerReady = (): boolean => state.ready;
