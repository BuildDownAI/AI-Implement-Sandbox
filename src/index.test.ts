import { vi, beforeEach, describe, it, expect } from "vitest";

vi.mock("./operations", () => ({
  FLY_MACHINE_TIMEOUT_MS: 60 * 60 * 1000,
  MAX_STUCK_ATTEMPTS: 3,
  incrementStuckAttempts: vi.fn(),
  resetStuckAttempts: vi.fn(),
  invalidateNonce: vi.fn(),
  destroyMachine: vi.fn(),
  removeLocalContainer: vi.fn(),
  resetTicket: vi.fn(),
  clearWorkingState: vi.fn(),
  notifyStuckGiveUp: vi.fn(),
  markReadyForReview: vi.fn(),
  postTimeoutStatusComment: vi.fn(),
  postSessionLogsComment: vi.fn(),
  postStuckGiveUpComment: vi.fn(),
}));

import {
  monitorFlyMachineJob,
  monitorLocalDockerJob,
  handleBoundedRemediation,
} from "./index";
import * as ops from "./operations";
import type { FlyMachineJob, LocalDockerJob } from "./types";

const TIMEOUT_MS = 60 * 60 * 1000;
const OLD = Date.now() - 70 * 60 * 1000;
const RECENT = Date.now() - 10 * 60 * 1000;

const flyJob = (overrides: Partial<FlyMachineJob> = {}): FlyMachineJob => ({
  id: "job-fly-1",
  issueId: "issue-1",
  dispatchedAt: OLD,
  machineId: "machine-abc",
  ...overrides,
});

const dockerJob = (overrides: Partial<LocalDockerJob> = {}): LocalDockerJob => ({
  id: "job-docker-1",
  issueId: "issue-2",
  dispatchedAt: OLD,
  containerId: "container-xyz",
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(ops.destroyMachine).mockResolvedValue(undefined);
  vi.mocked(ops.removeLocalContainer).mockResolvedValue(undefined);
  vi.mocked(ops.resetTicket).mockResolvedValue(undefined);
  vi.mocked(ops.clearWorkingState).mockResolvedValue(undefined);
  vi.mocked(ops.notifyStuckGiveUp).mockResolvedValue(undefined);
  vi.mocked(ops.markReadyForReview).mockResolvedValue(undefined);
  vi.mocked(ops.postTimeoutStatusComment).mockResolvedValue(undefined);
  vi.mocked(ops.postSessionLogsComment).mockResolvedValue(undefined);
  vi.mocked(ops.postStuckGiveUpComment).mockResolvedValue(undefined);
  vi.mocked(ops.incrementStuckAttempts).mockReturnValue(1);
});

// ---------------------------------------------------------------------------
// Fly Machine — timeout paths
// ---------------------------------------------------------------------------

describe("monitorFlyMachineJob — timeout, under-budget (attempts ≤ 3)", () => {
  it("destroys machine, invalidates nonce, resets ticket, does not hard-stop", async () => {
    vi.mocked(ops.incrementStuckAttempts).mockReturnValue(3); // 3 ≤ 3

    const job = flyJob();
    await monitorFlyMachineJob(job, { state: "started" });

    expect(ops.destroyMachine).toHaveBeenCalledWith("machine-abc");
    expect(ops.invalidateNonce).toHaveBeenCalledWith("job-fly-1");
    expect(ops.resetTicket).toHaveBeenCalledWith(job);
    expect(ops.notifyStuckGiveUp).not.toHaveBeenCalled();
    expect(ops.clearWorkingState).not.toHaveBeenCalled();
    expect(ops.postTimeoutStatusComment).toHaveBeenCalledWith(job, "machine_timeout");
    expect(ops.postStuckGiveUpComment).not.toHaveBeenCalled();
  });
});

describe("monitorFlyMachineJob — timeout, over-budget (attempts > 3)", () => {
  it("destroys machine, invalidates nonce, hard-stops with stuck_giveup, preserves dedup", async () => {
    vi.mocked(ops.incrementStuckAttempts).mockReturnValue(4); // 4 > 3

    const job = flyJob();
    await monitorFlyMachineJob(job, { state: "started" });

    expect(ops.destroyMachine).toHaveBeenCalledWith("machine-abc");
    expect(ops.invalidateNonce).toHaveBeenCalledWith("job-fly-1");
    expect(ops.resetTicket).not.toHaveBeenCalled();
    expect(ops.clearWorkingState).toHaveBeenCalledWith(job);
    expect(ops.postStuckGiveUpComment).toHaveBeenCalledWith(job, "machine_timeout");
    expect(ops.notifyStuckGiveUp).toHaveBeenCalledWith(job);
  });
});

// ---------------------------------------------------------------------------
// Fly Machine — success / failure paths
// ---------------------------------------------------------------------------

describe("monitorFlyMachineJob — success path", () => {
  it("marks ready for review and resets stuck attempts", async () => {
    const job = flyJob({ dispatchedAt: RECENT });
    await monitorFlyMachineJob(job, { state: "stopped", exitCode: 0 });

    expect(ops.markReadyForReview).toHaveBeenCalledWith(job);
    expect(ops.resetStuckAttempts).toHaveBeenCalledWith("issue-1");
    expect(ops.resetTicket).not.toHaveBeenCalled();
    expect(ops.notifyStuckGiveUp).not.toHaveBeenCalled();
  });
});

describe("monitorFlyMachineJob — non-timeout failure path", () => {
  it("resets ticket without touching bounded-remediation", async () => {
    const job = flyJob({ dispatchedAt: RECENT });
    await monitorFlyMachineJob(job, { state: "stopped", exitCode: 1 });

    expect(ops.resetTicket).toHaveBeenCalledWith(job);
    expect(ops.destroyMachine).not.toHaveBeenCalled();
    expect(ops.notifyStuckGiveUp).not.toHaveBeenCalled();
    expect(ops.clearWorkingState).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Local Docker — timeout paths
// ---------------------------------------------------------------------------

describe("monitorLocalDockerJob — timeout, under-budget (attempts ≤ 3)", () => {
  it("removes container, invalidates nonce, resets ticket, does not hard-stop", async () => {
    vi.mocked(ops.incrementStuckAttempts).mockReturnValue(2); // 2 ≤ 3

    const job = dockerJob();
    await monitorLocalDockerJob(job, { state: "running" });

    expect(ops.removeLocalContainer).toHaveBeenCalledWith("container-xyz");
    expect(ops.invalidateNonce).toHaveBeenCalledWith("job-docker-1");
    expect(ops.resetTicket).toHaveBeenCalledWith(job);
    expect(ops.notifyStuckGiveUp).not.toHaveBeenCalled();
    expect(ops.clearWorkingState).not.toHaveBeenCalled();
    expect(ops.postTimeoutStatusComment).toHaveBeenCalledWith(job, "container_timeout");
    expect(ops.postStuckGiveUpComment).not.toHaveBeenCalled();
  });
});

describe("monitorLocalDockerJob — timeout, over-budget (attempts > 3)", () => {
  it("removes container, invalidates nonce, hard-stops with stuck_giveup, preserves dedup", async () => {
    vi.mocked(ops.incrementStuckAttempts).mockReturnValue(4); // 4 > 3

    const job = dockerJob();
    await monitorLocalDockerJob(job, { state: "running" });

    expect(ops.removeLocalContainer).toHaveBeenCalledWith("container-xyz");
    expect(ops.invalidateNonce).toHaveBeenCalledWith("job-docker-1");
    expect(ops.resetTicket).not.toHaveBeenCalled();
    expect(ops.clearWorkingState).toHaveBeenCalledWith(job);
    expect(ops.postStuckGiveUpComment).toHaveBeenCalledWith(job, "container_timeout");
    expect(ops.notifyStuckGiveUp).toHaveBeenCalledWith(job);
  });
});

// ---------------------------------------------------------------------------
// Local Docker — success path
// ---------------------------------------------------------------------------

describe("monitorLocalDockerJob — success path", () => {
  it("marks ready for review and resets stuck attempts", async () => {
    const job = dockerJob({ dispatchedAt: RECENT });
    await monitorLocalDockerJob(job, { state: "exited", exitCode: 0 });

    expect(ops.markReadyForReview).toHaveBeenCalledWith(job);
    expect(ops.resetStuckAttempts).toHaveBeenCalledWith("issue-2");
    expect(ops.resetTicket).not.toHaveBeenCalled();
    expect(ops.notifyStuckGiveUp).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Generalised helper — stopRunner error handling
// ---------------------------------------------------------------------------

describe("handleBoundedRemediation — stopRunner error handling", () => {
  it("logs teardown error but still increments attempts and posts appropriate status", async () => {
    vi.mocked(ops.incrementStuckAttempts).mockReturnValue(1); // under-budget
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const failingStop = vi.fn().mockRejectedValue(new Error("teardown failed"));

    const job = flyJob();
    await handleBoundedRemediation(job, failingStop, "machine_timeout");

    expect(consoleSpy).toHaveBeenCalled();
    expect(ops.incrementStuckAttempts).toHaveBeenCalledWith("issue-1");
    expect(ops.resetTicket).toHaveBeenCalledWith(job);
    expect(ops.notifyStuckGiveUp).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("still hard-stops when stopRunner throws and attempt is over-budget", async () => {
    vi.mocked(ops.incrementStuckAttempts).mockReturnValue(4); // over-budget
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const failingStop = vi.fn().mockRejectedValue(new Error("teardown failed"));

    const job = dockerJob();
    await handleBoundedRemediation(job, failingStop, "container_timeout");

    expect(consoleSpy).toHaveBeenCalled();
    expect(ops.clearWorkingState).toHaveBeenCalledWith(job);
    expect(ops.notifyStuckGiveUp).toHaveBeenCalledWith(job);
    expect(ops.resetTicket).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
