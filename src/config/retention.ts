export const retention = {
  operationalLogsDays: 90,
  securityLogsDays: 180,
  temporaryImportsHours: 24,
  supportAfterClosureMonths: 24,
  privacyRequestsAfterCompletionMonths: 24,
  deletedAccountActiveDataTargetDays: 30,
  orphanedFilesCleanupDays: 30,
  toolHistory: "while-workspace-active",
  billing: "active-plus-legal-or-dispute-need",
} as const;
