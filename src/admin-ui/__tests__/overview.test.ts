import { describe, it, expect } from "vitest";
import { isNeedsAttention, countNeedsAttention } from "../pages/overview";

const now = new Date().toISOString();
const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

describe("isNeedsAttention", () => {
  it("counts stuck_giveup within 24h", () => {
    expect(isNeedsAttention({ status: "timed_out", conclusion: "stuck_giveup", created_at: now })).toBe(true);
  });

  it("excludes stuck_giveup older than 24h", () => {
    expect(isNeedsAttention({ status: "timed_out", conclusion: "stuck_giveup", created_at: old })).toBe(false);
  });

  it("counts failed within 24h", () => {
    expect(isNeedsAttention({ status: "failed", created_at: now })).toBe(true);
  });

  it("counts review_failed within 24h", () => {
    expect(isNeedsAttention({ status: "review_failed", created_at: now })).toBe(true);
  });

  it("does not count ordinary timed_out (machine_timeout)", () => {
    expect(isNeedsAttention({ status: "timed_out", conclusion: "machine_timeout", created_at: now })).toBe(false);
  });

  it("does not count ordinary timed_out with no conclusion", () => {
    expect(isNeedsAttention({ status: "timed_out", created_at: now })).toBe(false);
  });

  it("does not count completed", () => {
    expect(isNeedsAttention({ status: "completed", created_at: now })).toBe(false);
  });

  it("does not count running", () => {
    expect(isNeedsAttention({ status: "running", created_at: now })).toBe(false);
  });

  it("does not count dispatched", () => {
    expect(isNeedsAttention({ status: "dispatched", created_at: now })).toBe(false);
  });
});

describe("countNeedsAttention", () => {
  it("counts failed + review_failed + stuck_giveup, excludes others", () => {
    const jobs = [
      { id: "1", status: "timed_out", conclusion: "stuck_giveup", created_at: now },
      { id: "2", status: "failed", created_at: now },
      { id: "3", status: "review_failed", created_at: now },
      { id: "4", status: "completed", created_at: now },
      { id: "5", status: "timed_out", conclusion: "machine_timeout", created_at: now },
      { id: "6", status: "running", created_at: now },
    ] as const;
    expect(countNeedsAttention([...jobs])).toBe(3);
  });

  it("excludes stuck_giveup older than 24h", () => {
    const jobs = [
      { id: "1", status: "timed_out", conclusion: "stuck_giveup", created_at: old },
      { id: "2", status: "failed", created_at: now },
    ] as const;
    expect(countNeedsAttention([...jobs])).toBe(1);
  });

  it("returns 0 when no attention-worthy jobs", () => {
    const jobs = [
      { id: "1", status: "completed", created_at: now },
      { id: "2", status: "running", created_at: now },
    ] as const;
    expect(countNeedsAttention([...jobs])).toBe(0);
  });

  it("counts a stuck_giveup job alone", () => {
    const jobs = [{ id: "1", status: "timed_out", conclusion: "stuck_giveup", created_at: now }] as const;
    expect(countNeedsAttention([...jobs])).toBe(1);
  });
});
