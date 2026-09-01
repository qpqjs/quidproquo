import { describe, expect, it, vi } from 'vitest';

// Readiness is module state, so each test needs a fresh copy of the module.
const loadModule = async () => {
  vi.resetModules();
  return import('./devServerReadiness');
};

describe('devServerReadiness', () => {
  it('is not ready before anything marks it', async () => {
    // The window that matters: the api plugin has bound its port and is
    // answering, but later plugins have not started yet.
    const { isDevServerReady } = await loadModule();

    expect(isDevServerReady()).toBe(false);
  });

  it('is ready once marked', async () => {
    const { isDevServerReady, markDevServerReady } = await loadModule();

    markDevServerReady();

    expect(isDevServerReady()).toBe(true);
  });

  it('stays ready when marked again', async () => {
    // startDevServer and a tinker session started inside it both mark it.
    const { isDevServerReady, markDevServerReady } = await loadModule();

    markDevServerReady();
    markDevServerReady();

    expect(isDevServerReady()).toBe(true);
  });
});
