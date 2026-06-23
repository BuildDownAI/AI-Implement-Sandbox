import type { Job } from "../../admin";

type BadgeRow = Pick<Job, "status" | "conclusion" | "attempts">;

export function renderJobBadge(job: BadgeRow): string {
  if (job.status === "timed_out" && job.conclusion === "stuck_giveup") {
    const attemptSuffix = job.attempts ? ` · ${job.attempts} attempts` : "";
    return `<span class="badge badge-fail">Needs human${attemptSuffix}</span>`;
  }

  const badgeMap: Partial<Record<string, string>> = {
    dispatched: `<span class="badge badge-neutral">dispatched</span>`,
    running: `<span class="badge badge-info">running</span>`,
    review_failed: `<span class="badge badge-fail">review failed</span>`,
    failed: `<span class="badge badge-fail">failed</span>`,
    completed: `<span class="badge badge-success">completed</span>`,
    timed_out: `<span class="badge badge-warn">timed out</span>`,
  };

  return badgeMap[job.status] ?? `<span class="badge badge-neutral">${job.status}</span>`;
}

export function renderJobRow(job: Job): string {
  const badge = renderJobBadge(job);
  const title = window.esc(job.title ?? job.issue_id ?? job.id);
  const date = window.esc(new Date(job.created_at).toLocaleString());
  return `<tr>
    <td>${title}</td>
    <td>${badge}</td>
    <td>${date}</td>
  </tr>`;
}

export function renderPipelinesPage(jobs: Job[]): string {
  const rows = jobs.map(renderJobRow).join("\n");
  return `<section>
    <h2>Recent dispatches</h2>
    <table>
      <thead><tr><th>Issue</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
}
