import type { Job } from "../../admin";

type JobSummary = Pick<Job, "id" | "status" | "conclusion" | "created_at">;

const ATTENTION_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isNeedsAttention(job: Pick<JobSummary, "status" | "conclusion" | "created_at">): boolean {
  const age = Date.now() - new Date(job.created_at).getTime();
  if (age > ATTENTION_WINDOW_MS) return false;
  if (job.status === "failed" || job.status === "review_failed") return true;
  if (job.status === "timed_out" && job.conclusion === "stuck_giveup") return true;
  return false;
}

export function countNeedsAttention(jobs: JobSummary[]): number {
  return jobs.filter(isNeedsAttention).length;
}

export function renderOverviewPage(jobs: JobSummary[]): string {
  const attentionCount = countNeedsAttention(jobs);
  return `<section>
    <h2>Overview</h2>
    <div class="kpi">
      <div class="kpi-item kpi-attention">
        <span class="kpi-value">${attentionCount}</span>
        <span class="kpi-label">needs attention</span>
      </div>
    </div>
  </section>`;
}
