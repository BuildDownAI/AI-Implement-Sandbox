import type {
  Job,
  FlyMachineJob,
  LocalDockerJob,
  LastRunStatus,
  MachineStatus,
  ContainerStatus,
} from "./types";
import {
  FLY_MACHINE_TIMEOUT_MS,
  MAX_STUCK_ATTEMPTS,
  incrementStuckAttempts,
  resetStuckAttempts,
  invalidateNonce,
  destroyMachine,
  removeLocalContainer,
  resetTicket,
  clearWorkingState,
  notifyStuckGiveUp,
  markReadyForReview,
  postTimeoutStatusComment,
  postSessionLogsComment,
  postStuckGiveUpComment,
} from "./operations";

/**
 * Shared bounded-remediation path for all execution modes.
 *
 * Callers supply a mode-specific `stopRunner` callback (destroy Fly machine,
 * remove local container, cancel GHA workflow run, etc.). The helper:
 *   - Runs `stopRunner` unconditionally (teardown is always needed).
 *   - Increments the per-issue stuck-attempt counter.
 *   - Attempts ≤ MAX_STUCK_ATTEMPTS → post timeout comment, resetTicket
 *     (issue becomes re-dispatchable).
 *   - Attempts > MAX_STUCK_ATTEMPTS → hard-stop: clearWorkingState,
 *     post stuck_giveup comment, notifyStuckGiveUp. Dedup key is preserved
 *     so the poller cannot re-dispatch.
 *
 * If `stopRunner` throws, the error is logged but the attempt logic still
 * runs so a flaky teardown never blocks the hard-stop from firing.
 */
export async function handleBoundedRemediation(
  job: Job,
  stopRunner: () => Promise<void>,
  lastRunStatus: LastRunStatus
): Promise<void> {
  try {
    await stopRunner();
  } catch (err) {
    console.error(
      `[bounded-remediation] stopRunner failed for job ${job.id}:`,
      err
    );
  }

  const attempts = incrementStuckAttempts(job.issueId);

  if (attempts <= MAX_STUCK_ATTEMPTS) {
    await postSessionLogsComment(job);
    await postTimeoutStatusComment(job, lastRunStatus);
    await resetTicket(job);
  } else {
    await clearWorkingState(job);
    await postStuckGiveUpComment(job, lastRunStatus);
    await notifyStuckGiveUp(job);
  }
}

export async function monitorFlyMachineJob(
  job: FlyMachineJob,
  machineStatus: MachineStatus
): Promise<void> {
  if (
    machineStatus.state === "started" &&
    Date.now() - job.dispatchedAt > FLY_MACHINE_TIMEOUT_MS
  ) {
    await handleBoundedRemediation(
      job,
      async () => {
        await destroyMachine(job.machineId);
        invalidateNonce(job.id);
      },
      "machine_timeout"
    );
    return;
  }

  if (machineStatus.state === "stopped") {
    if (machineStatus.exitCode === 0) {
      await markReadyForReview(job);
      resetStuckAttempts(job.issueId);
    } else {
      await resetTicket(job);
    }
  }
}

export async function monitorLocalDockerJob(
  job: LocalDockerJob,
  containerStatus: ContainerStatus
): Promise<void> {
  if (
    containerStatus.state === "running" &&
    Date.now() - job.dispatchedAt > FLY_MACHINE_TIMEOUT_MS
  ) {
    await handleBoundedRemediation(
      job,
      async () => {
        await removeLocalContainer(job.containerId);
        invalidateNonce(job.id);
      },
      "container_timeout"
    );
    return;
  }

  if (containerStatus.state === "exited") {
    if (containerStatus.exitCode === 0) {
      await markReadyForReview(job);
      resetStuckAttempts(job.issueId);
    } else {
      await resetTicket(job);
    }
  }
}
