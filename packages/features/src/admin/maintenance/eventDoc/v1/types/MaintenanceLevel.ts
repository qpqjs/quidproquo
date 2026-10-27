export enum MaintenanceLevel {
  /**
   * Admin-only: while Internal the maintenance is completely invisible to end
   * users — excluded from every broadcast and connect-time sync. Move it to
   * Info/Low/High to go public; move it back (or close it) to disappear.
   */
  Internal = 'Internal',
  /** Purely informational — a calm (blue) banner; nothing is wrong. */
  Info = 'Info',
  /** Warning — users see the maintenance banner and keep working. */
  Low = 'Low',
  /** Critical — frontends lock the UI until the maintenance closes. */
  High = 'High',
}
