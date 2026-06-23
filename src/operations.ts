import type { Job, LastRunStatus } from "./types";

export const FLY_MACHINE_TIMEOUT_MS = 60 * 60 * 1000;
export const MAX_STUCK_ATTEMPTS = 3;

const stuckAttemptsMap: Record<string, number> = {};

export function getStuckAttempts(issueId: string): number {
  return stuckAttemptsMap[issueId] ?? 0;
}

export function incrementStuckAttempts(issueId: string): number {
  stuckAttemptsMap[issueId] = (stuckAttemptsMap[issueId] ?? 0) + 1;
  return stuckAttemptsMap[issueId];
}

export function resetStuckAttempts(issueId: string): void {
  stuckAttemptsMap[issueId] = 0;
}

export function invalidateNonce(_jobId: string): void {}

export async function destroyMachine(_machineId: string): Promise<void> {}

export async function removeLocalContainer(_containerId: string): Promise<void> {}

export async function cancelWorkflowRun(_runId: string): Promise<void> {}

export async function resetTicket(_job: Job): Promise<void> {}

export async function clearWorkingState(_job: Job): Promise<void> {}

export async function notifyStuckGiveUp(_job: Job): Promise<void> {}

export async function markReadyForReview(_job: Job): Promise<void> {}

export async function postTimeoutStatusComment(
  _job: Job,
  _lastRunStatus: LastRunStatus
): Promise<void> {}

export async function postSessionLogsComment(_job: Job): Promise<void> {}

export async function postStuckGiveUpComment(
  _job: Job,
  _lastRunStatus: LastRunStatus
): Promise<void> {}
