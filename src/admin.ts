export type JobStatus =
  | "dispatched"
  | "running"
  | "review_failed"
  | "failed"
  | "completed"
  | "timed_out";

export interface Job {
  id: string;
  status: JobStatus;
  conclusion?: string | null;
  attempts?: number | null;
  created_at: string;
  issue_id?: string | null;
  title?: string | null;
}

export interface ListLogResult {
  jobs: Job[];
  total: number;
}
