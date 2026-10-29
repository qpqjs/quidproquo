import fs from 'fs';

export const isDirectory = (candidate: string): boolean => fs.existsSync(candidate) && fs.statSync(candidate).isDirectory();
