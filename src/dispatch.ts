import type { IssueMapping, LogEntry } from "./types";

/**
 * Dispatches a workflow_dispatch event to a GitHub Actions workflow.
 * POSTs to the GitHub API's workflow dispatch endpoint with the supplied inputs.
 */
export async function dispatchWorkflow(
  _ghToken: string,
  _mapping: IssueMapping,
  _inputs: Record<string, string>,
): Promise<void> {
  // Production: POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches
}

/**
 * Appends a structured entry to the orchestrator's persistent log.
 */
export async function appendLog(
  _entry: Partial<LogEntry> & { type: string },
): Promise<void> {
  // Production: writes to the configured log sink (database, file, etc.)
}
