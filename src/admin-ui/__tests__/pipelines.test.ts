import { describe, it, expect } from "vitest";
import { renderJobBadge } from "../pages/pipelines";

describe("renderJobBadge – stuck_giveup", () => {
  it('renders "Needs human" badge with badge-fail class', () => {
    const badge = renderJobBadge({ status: "timed_out", conclusion: "stuck_giveup" });
    expect(badge).toContain("Needs human");
    expect(badge).toContain("badge-fail");
  });

  it("surfaces attempt count when available", () => {
    const badge = renderJobBadge({ status: "timed_out", conclusion: "stuck_giveup", attempts: 3 });
    expect(badge).toContain("Needs human");
    expect(badge).toContain("3 attempts");
  });

  it("renders plain Needs human when attempts is absent", () => {
    const badge = renderJobBadge({ status: "timed_out", conclusion: "stuck_giveup", attempts: undefined });
    expect(badge).toContain("Needs human");
    expect(badge).not.toContain("attempts");
  });

  it("renders plain Needs human when attempts is null", () => {
    const badge = renderJobBadge({ status: "timed_out", conclusion: "stuck_giveup", attempts: null });
    expect(badge).toContain("Needs human");
    expect(badge).not.toContain("attempts");
  });
});

describe("renderJobBadge – ordinary timed_out unaffected", () => {
  it("renders timed out badge for machine_timeout conclusion", () => {
    const badge = renderJobBadge({ status: "timed_out", conclusion: "machine_timeout" });
    expect(badge).toContain("timed out");
    expect(badge).toContain("badge-warn");
    expect(badge).not.toContain("Needs human");
  });

  it("renders timed out badge when conclusion is absent", () => {
    const badge = renderJobBadge({ status: "timed_out" });
    expect(badge).toContain("timed out");
    expect(badge).not.toContain("Needs human");
  });

  it("renders timed out badge for run_not_found conclusion", () => {
    const badge = renderJobBadge({ status: "timed_out", conclusion: "run_not_found" });
    expect(badge).toContain("timed out");
    expect(badge).not.toContain("Needs human");
  });
});

describe("renderJobBadge – other statuses unaffected", () => {
  it("renders dispatched badge", () => {
    const badge = renderJobBadge({ status: "dispatched" });
    expect(badge).toContain("dispatched");
    expect(badge).toContain("badge-neutral");
  });

  it("renders running badge", () => {
    const badge = renderJobBadge({ status: "running" });
    expect(badge).toContain("running");
    expect(badge).toContain("badge-info");
  });

  it("renders review failed badge with badge-fail class", () => {
    const badge = renderJobBadge({ status: "review_failed" });
    expect(badge).toContain("review failed");
    expect(badge).toContain("badge-fail");
  });

  it("renders failed badge", () => {
    const badge = renderJobBadge({ status: "failed" });
    expect(badge).toContain("failed");
    expect(badge).toContain("badge-fail");
  });

  it("renders completed badge", () => {
    const badge = renderJobBadge({ status: "completed" });
    expect(badge).toContain("completed");
    expect(badge).toContain("badge-success");
  });
});
