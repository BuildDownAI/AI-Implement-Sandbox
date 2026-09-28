import { describe, it, expect } from "vitest";
import {
    PROJECT_STATUSES,
    ProjectStatus,
    canTransition,
    allowedNextStatuses,
} from "@/lib/project-status";

describe("PROJECT_STATUSES", () => {
    it("contains all three values in order", () => {
        expect(PROJECT_STATUSES).toEqual(["draft", "active", "archived"]);
    });
});

describe("canTransition", () => {
    it.each([
        ["draft", "draft", true],
        ["draft", "active", true],
        ["draft", "archived", true],
        ["active", "draft", false],
        ["active", "active", true],
        ["active", "archived", true],
        ["archived", "draft", false],
        ["archived", "active", true],
        ["archived", "archived", true],
    ] as [ProjectStatus, ProjectStatus, boolean][])(
        "%s → %s is %s",
        (from, to, expected) => {
            expect(canTransition(from, to)).toBe(expected);
        }
    );
});

describe("allowedNextStatuses", () => {
    it('returns all statuses for "draft"', () => {
        expect(allowedNextStatuses("draft")).toEqual(["draft", "active", "archived"]);
    });

    it('returns ["active", "archived"] for "active"', () => {
        expect(allowedNextStatuses("active")).toEqual(["active", "archived"]);
    });

    it('returns ["active", "archived"] for "archived"', () => {
        expect(allowedNextStatuses("archived")).toEqual(["active", "archived"]);
    });

    it("mutating the returned array does not affect subsequent calls", () => {
        const first = allowedNextStatuses("active");
        first.push("draft" as ProjectStatus);
        expect(allowedNextStatuses("active")).toEqual(["active", "archived"]);
    });
});
