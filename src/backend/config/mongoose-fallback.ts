// Simple flag to declare if MongoDB database is currently offline
let isDatabaseOffline = false;

export function setDatabaseOffline(offline: boolean) {
  isDatabaseOffline = offline;
  if (offline) {
    console.warn('[SubPilot Mongoose Fallback] Disabled. All operations will attempt to use MongoDB Atlas directly.');
  }
}

export function isDatabaseModeOffline(): boolean {
  return isDatabaseOffline;
}

console.log('[SubPilot Mongoose Fallback] Resiliency system is completely DISABLED by user request.');
