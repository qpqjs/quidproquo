import { createOutput } from './out';

const out = createOutput('timing');
export const logTimeStart = (name: string): void => out.time(name);

export const logTimeEnd = (name: string): void => {
  out.log('When:', new Date().toLocaleTimeString());
  out.timeEnd(name);
};
