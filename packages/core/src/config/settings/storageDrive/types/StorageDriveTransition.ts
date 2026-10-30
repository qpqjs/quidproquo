import { StorageDriveTier } from './StorageDriveTier';

export type StorageDriveTransition = { storageDriveTier: StorageDriveTier } & (
  | {
      transitionAfterDays: number;
      transitionDate?: never;
    }
  | {
      transitionAfterDays?: never;
      transitionDate: string;
    }
);
