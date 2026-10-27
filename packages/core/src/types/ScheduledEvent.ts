export interface ScheduledEventParams<T extends Record<string, any> = {}> {
  time: string;
  correlation: string;

  metadata: T;
}
