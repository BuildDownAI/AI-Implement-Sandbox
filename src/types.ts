export interface Job {
  id: string;
  issueId: string;
  dispatchedAt: number;
}

export interface FlyMachineJob extends Job {
  machineId: string;
}

export interface LocalDockerJob extends Job {
  containerId: string;
}

export type LastRunStatus =
  | "machine_timeout"
  | "container_timeout"
  | "workflow_timeout";

export interface MachineStatus {
  state: "started" | "stopped" | "destroyed" | "created";
  exitCode?: number;
}

export interface ContainerStatus {
  state: "running" | "exited" | "created";
  exitCode?: number;
}
