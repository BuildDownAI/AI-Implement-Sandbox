import { describe, it, expect } from "vitest";
import { formatStageAge } from "@/lib/stage-age";

describe("formatStageAge", () => {
    const now = new Date("2026-01-10T12:00:00Z");

    it("returns 'since today' for a future timestamp (clock skew)", () => {
        const future = new Date(now.getTime() + 1).toISOString();
        expect(formatStageAge(future, now)).toBe("In this stage since today");
    });

    it("returns 'since today' for the same instant", () => {
        expect(formatStageAge(now.toISOString(), now)).toBe("In this stage since today");
    });

    it("returns 'since today' for 23h 59m before now", () => {
        const ts = new Date(now.getTime() - 86_399_000).toISOString();
        expect(formatStageAge(ts, now)).toBe("In this stage since today");
    });

    it("returns '1 day' for exactly 24h before now", () => {
        const ts = new Date(now.getTime() - 86_400_000).toISOString();
        expect(formatStageAge(ts, now)).toBe("In this stage for 1 day");
    });

    it("returns '1 day' for 24h + 1ms before now", () => {
        const ts = new Date(now.getTime() - 86_400_001).toISOString();
        expect(formatStageAge(ts, now)).toBe("In this stage for 1 day");
    });

    it("returns '2 days' for 48h before now", () => {
        const ts = new Date(now.getTime() - 172_800_000).toISOString();
        expect(formatStageAge(ts, now)).toBe("In this stage for 2 days");
    });

    it("returns '10 days' for 10 days before now", () => {
        const ts = new Date(now.getTime() - 864_000_000).toISOString();
        expect(formatStageAge(ts, now)).toBe("In this stage for 10 days");
    });

    it("returns 'since today' for null", () => {
        expect(formatStageAge(null, now)).toBe("In this stage since today");
    });
});
