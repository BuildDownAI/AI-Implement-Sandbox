import { describe, it, expect, vi, beforeEach } from "vitest";
import { dispatchPlanning } from "../index";
import type { Config, IssueMapping } from "../types";

vi.mock("../runner-image");
vi.mock("../dispatch");

import { resolveDispatchRunnerImage } from "../runner-image";
import { dispatchWorkflow, appendLog } from "../dispatch";

const mockMapping: IssueMapping = {
  owner: "BuildDownAI",
  repo: "orchestrator-hello-world-test",
  issue: { number: 42 },
  planningWorkflow: "claude-plan.yml",
};

describe("dispatchPlanning — GHA path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dispatchWorkflow).mockResolvedValue(undefined);
    vi.mocked(appendLog).mockResolvedValue(undefined);
  });

  describe("runner_image forwarding", () => {
    it("forwards runner_image when SESSION_IMAGE is explicitly set", async () => {
      const image = "ghcr.io/builddownai/ai-implement-runner:next";
      vi.mocked(resolveDispatchRunnerImage).mockResolvedValue(image);

      const config: Config = { sessionImage: image };
      await dispatchPlanning(config, mockMapping);

      expect(dispatchWorkflow).toHaveBeenCalledOnce();
      const [, , inputs] = vi.mocked(dispatchWorkflow).mock.calls[0];
      expect(inputs).toHaveProperty("runner_image", image);
    });

    it("omits runner_image when neither SESSION_IMAGE nor .ai-implement/image.yml is set", async () => {
      vi.mocked(resolveDispatchRunnerImage).mockResolvedValue(null);

      const config: Config = {};
      await dispatchPlanning(config, mockMapping);

      expect(dispatchWorkflow).toHaveBeenCalledOnce();
      const [, , inputs] = vi.mocked(dispatchWorkflow).mock.calls[0];
      expect(inputs).not.toHaveProperty("runner_image");
    });

    it("forwards runner_image from a per-repo .ai-implement/image.yml override", async () => {
      const image = "ghcr.io/myorg/custom-runner:v2";
      vi.mocked(resolveDispatchRunnerImage).mockResolvedValue(image);

      const config: Config = {};
      await dispatchPlanning(config, mockMapping);

      expect(dispatchWorkflow).toHaveBeenCalledOnce();
      const [, , inputs] = vi.mocked(dispatchWorkflow).mock.calls[0];
      expect(inputs).toHaveProperty("runner_image", image);
    });
  });

  describe("appendLog records sessionImage", () => {
    it("records the resolved image in appendLog when explicit", async () => {
      const image = "ghcr.io/builddownai/ai-implement-runner:next";
      vi.mocked(resolveDispatchRunnerImage).mockResolvedValue(image);

      await dispatchPlanning({ sessionImage: image }, mockMapping);

      expect(appendLog).toHaveBeenCalledOnce();
      const [entry] = vi.mocked(appendLog).mock.calls[0];
      expect(entry).toMatchObject({ sessionImage: image });
    });

    it("records null sessionImage in appendLog when no image is resolved", async () => {
      vi.mocked(resolveDispatchRunnerImage).mockResolvedValue(null);

      await dispatchPlanning({}, mockMapping);

      expect(appendLog).toHaveBeenCalledOnce();
      const [entry] = vi.mocked(appendLog).mock.calls[0];
      expect(entry).toMatchObject({ sessionImage: null });
    });
  });

  describe("dispatch log line", () => {
    it("includes the resolved image tag when runner_image is forwarded", async () => {
      const image = "ghcr.io/builddownai/ai-implement-runner:next";
      vi.mocked(resolveDispatchRunnerImage).mockResolvedValue(image);
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await dispatchPlanning({ sessionImage: image }, mockMapping);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(image));
      consoleSpy.mockRestore();
    });

    it("includes 'workflow-default' when no image is resolved", async () => {
      vi.mocked(resolveDispatchRunnerImage).mockResolvedValue(null);
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await dispatchPlanning({}, mockMapping);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("workflow-default"),
      );
      consoleSpy.mockRestore();
    });
  });
});
