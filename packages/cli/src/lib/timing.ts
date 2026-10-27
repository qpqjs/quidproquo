export const logTimeStart = (name: string): void => console.time(name);

export const logTimeEnd = (name: string): void => {
  console.log('When:', new Date().toLocaleTimeString());
  console.timeEnd(name);
};
