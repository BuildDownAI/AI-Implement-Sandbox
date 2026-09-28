import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusTimeline } from "@/app/(app)/projects/[projectId]/status-timeline";
import type { ProjectStatusEvent } from "@/app/(app)/projects/queries";

const supabaseQueryHolder = vi.hoisted(() => ({
    result: { data: [] as ProjectStatusEvent[] | null, error: null as { message: string } | null },
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue({
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => Promise.resolve(supabaseQueryHolder.result),
                }),
            }),
        }),
    }),
}));

const makeEvent = (
    overrides: Partial<ProjectStatusEvent> & { id: string }
): ProjectStatusEvent => ({
    changed_at: "2026-01-01T10:00:00Z",
    from_status: null,
    id: overrides.id,
    project_id: "proj-1",
    to_status: "draft",
    user_id: "user-1",
    ...overrides,
});

const THREE_EVENTS: ProjectStatusEvent[] = [
    makeEvent({ id: "e1", from_status: null, to_status: "draft", changed_at: "2026-01-01T10:00:00Z" }),
    makeEvent({ id: "e2", from_status: "draft", to_status: "active", changed_at: "2026-02-01T10:00:00Z" }),
    makeEvent({ id: "e3", from_status: "active", to_status: "archived", changed_at: "2026-03-01T10:00:00Z" }),
];

describe("StatusTimeline", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders three list items in order for creation + two change events", () => {
        render(<StatusTimeline events={THREE_EVENTS} />);
        const items = screen.getAllByRole("listitem");
        expect(items).toHaveLength(3);
        expect(items[0].textContent).toMatch(/created as draft/i);
        expect(items[1].textContent).toMatch(/draft.*active/);
        expect(items[2].textContent).toMatch(/active.*archived/);
    });

    it("renders each <time> dateTime attribute equal to the event's changed_at", () => {
        render(<StatusTimeline events={THREE_EVENTS} />);
        const times = document.querySelectorAll("time");
        expect(times).toHaveLength(3);
        expect(times[0].getAttribute("dateTime")).toBe("2026-01-01T10:00:00Z");
        expect(times[1].getAttribute("dateTime")).toBe("2026-02-01T10:00:00Z");
        expect(times[2].getAttribute("dateTime")).toBe("2026-03-01T10:00:00Z");
    });

    it("shows 'No status history yet.' and no list items when events is empty", () => {
        render(<StatusTimeline events={[]} />);
        expect(screen.getByText(/no status history yet/i)).toBeInTheDocument();
        expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    });

    it("renders the card title 'Status history'", () => {
        render(<StatusTimeline events={THREE_EVENTS} />);
        expect(screen.getByText("Status history")).toBeInTheDocument();
    });
});

describe("getStatusEvents", () => {
    it("returns [] when Supabase returns an error", async () => {
        supabaseQueryHolder.result = { data: null, error: { message: "DB error" } };

        const { getStatusEvents } = await import("@/app/(app)/projects/queries");
        const result = await getStatusEvents("any-id");
        expect(result).toEqual([]);
    });
});
