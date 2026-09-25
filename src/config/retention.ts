// Durations are intentionally unset until operational deletion and backup rules are approved.
export const retention = {
  account: null,
  workspace: null,
  toolHistory: null,
  billing: null,
  auditLogs: null,
  securityLogs: null,
  support: null,
  temporaryImports: null,
  uploadedFiles: null,
  deletedAccounts: null,
} as const;
