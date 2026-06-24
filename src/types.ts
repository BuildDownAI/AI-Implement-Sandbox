export interface Config {
  sessionImage?: string;
}

export interface IssueMapping {
  owner: string;
  repo: string;
  issue: { number: number };
  planningWorkflow: string;
}

export interface LogEntry {
  type: string;
  timestamp: string;
  owner: string;
  repo: string;
  issueNumber: number;
  sessionImage: string | null;
}
