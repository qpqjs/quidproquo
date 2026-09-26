/** The parts of the page location the addressing helpers read; `window.location` satisfies it. */
export type WebLocation = {
  protocol: string;
  hostname: string;
};
