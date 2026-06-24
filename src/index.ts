import type { Config, IssueMapping } from "./types";
import { resolveDispatchRunnerImage } from "./runner-image";
import { dispatchWorkflow, appendLog } from "./dispatch";

async function mintGhToken(_config: Config): Promise<string> {
  // Production: exchanges app credentials for a GitHub installation token.
  return process.env.GH_TOKEN ?? "";
}

/**
 * Dispatches a planning run to the target repo via the resolved execution path.
 *
 * fly-machines and local-docker paths are handled before this function (early
 * return). The GHA path continues here and mirrors the implementation dispatch
 * pattern: resolveDispatchRunnerImage is called and its result is forwarded only
 * when explicit — preserving the "only send when explicit" invariant so repos
 * that have not yet re-synced claude-plan.yml don't receive an unexpected
 * runner_image input and return a 422 from GitHub's dispatch endpoint.
 */
export async function dispatchPlanning(
  config: Config,
  mapping: IssueMapping,
): Promise<void> {
  const ghToken = await mintGhToken(config);
  const runnerImage = await resolveDispatchRunnerImage(config, mapping, ghToken);

  await dispatchWorkflow(ghToken, mapping, {
    issue_number: String(mapping.issue.number),
    ...(runnerImage ? { runner_image: runnerImage } : {}),
  });

  await appendLog({
    type: "planning_dispatched",
    timestamp: new Date().toISOString(),
    owner: mapping.owner,
    repo: mapping.repo,
    issueNumber: mapping.issue.number,
    sessionImage: runnerImage ?? null,
  });

  console.log(
    `Planning dispatched via GHA (image: ${runnerImage ?? "workflow-default"})`,
  );
}
