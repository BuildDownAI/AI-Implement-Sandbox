import type { Config, IssueMapping } from "./types";

/**
 * Resolves the runner image to forward to a GHA workflow_dispatch call.
 *
 * Returns the image string when an explicit override is configured — either a
 * per-repo `.ai-implement/image.yml` (checked via GitHub API) or the
 * orchestrator-level `SESSION_IMAGE` env var. Returns null when neither is
 * explicit, preserving the "only forward when explicit" invariant that prevents
 * un-re-synced target repos from receiving an unexpected `runner_image` input
 * and returning a 422 from GitHub's workflow dispatch endpoint.
 */
export async function resolveDispatchRunnerImage(
  config: Config,
  _mapping: IssueMapping,
  _ghToken: string,
): Promise<string | null> {
  return config.sessionImage ?? null;
}
