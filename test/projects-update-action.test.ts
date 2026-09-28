import { describe, it, expect, vi, beforeEach } from "vitest";
import { canTransition } from "@/lib/project-status";

const redirectMock = vi.hoisted(() => vi.fn(() => { throw new Error("NEXT_REDIRECT"); }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

const revalidatePathMock = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

const db = vi.hoisted(() => ({
  read: { data: { status: "active" } as { status: string } | null, error: null as { message: string } | null },
  write: { data: [{ id: "p1" }] as { id: string }[] | null, error: null as { message: string } | null },
  updateEqs: [] as [string, unknown][],
  updateCalled: false,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => db.read }) }),
      update: () => {
        db.updateCalled = true;
        const chain = {
          eq: (col: string, val: unknown) => { db.updateEqs.push([col, val]); return chain; },
          select: async () => db.write,
        };
        return chain;
      },
    }),
  }),
}));

vi.mock("@/lib/project-status", async () => {
  const actual = await vi.importActual<typeof import("@/lib/project-status")>("@/lib/project-status");
  return {
    ...actual,
    canTransition: vi.fn((from: string, to: string) => actual.canTransition(from as never, to as never)),
  };
});

import { updateProject } from "@/app/(app)/projects/actions";

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const defaultForm = { id: "p1", name: "My Project", status: "active" };

describe("updateProject transition rules", () => {
  beforeEach(() => {
    db.read = { data: { status: "active" }, error: null };
    db.write = { data: [{ id: "p1" }], error: null };
    db.updateEqs = [];
    db.updateCalled = false;
    redirectMock.mockClear();
    revalidatePathMock.mockClear();
    vi.mocked(canTransition).mockImplementation((from, to) => {
      if (to === "draft") return from === "draft";
      return true;
    });
  });

  it("returns error when read fails", async () => {
    db.read = { data: null, error: { message: "db error" } };
    const state = await updateProject({}, form(defaultForm));
    expect(state.error).toBe("db error");
    expect(db.updateCalled).toBe(false);
  });

  it("returns 'Project not found' when read returns no row", async () => {
    db.read = { data: null, error: null };
    const state = await updateProject({}, form(defaultForm));
    expect(state.error).toBe("Project not found");
    expect(db.updateCalled).toBe(false);
  });

  it("rejects active → draft with a status field error and never updates", async () => {
    db.read = { data: { status: "active" }, error: null };
    vi.mocked(canTransition).mockReturnValue(false);
    const state = await updateProject({}, form({ id: "p1", name: "X", status: "draft" }));
    expect(state.fieldErrors?.status).toBe("A project cannot move from active to draft.");
    expect(db.updateCalled).toBe(false);
  });

  it("returns error when update returns a write error", async () => {
    db.read = { data: { status: "active" }, error: null };
    db.write = { data: null, error: { message: "write error" } };
    const state = await updateProject({}, form({ id: "p1", name: "X", status: "active" }));
    expect(state.error).toBe("write error");
  });

  it("returns stale-data error when update matches zero rows", async () => {
    db.read = { data: { status: "active" }, error: null };
    db.write = { data: [], error: null };
    const state = await updateProject({}, form({ id: "p1", name: "X", status: "active" }));
    expect(state.error).toBe("This project changed while you were editing. Reload the page and try again.");
  });

  it("redirects on successful update and revalidates both paths", async () => {
    db.read = { data: { status: "active" }, error: null };
    db.write = { data: [{ id: "p1" }], error: null };
    await expect(updateProject({}, form({ id: "p1", name: "X", status: "active" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/projects/p1");
    expect(revalidatePathMock).toHaveBeenCalledTimes(2);
  });

  it("includes .eq('status', current) in the update chain", async () => {
    db.read = { data: { status: "active" }, error: null };
    db.write = { data: [{ id: "p1" }], error: null };
    await expect(updateProject({}, form({ id: "p1", name: "X", status: "active" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(db.updateEqs).toContainEqual(["status", "active"]);
  });
});
