export const PROJECT_STATUSES = ["draft", "active", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** True when a project may move from `from` to `to`. Same-to-same is always true. */
export function canTransition(from: ProjectStatus, to: ProjectStatus): boolean {
    if (to === "draft") return from === "draft";
    return true;
}

/** Every status reachable from `from`, including `from` itself, in PROJECT_STATUSES order. */
export function allowedNextStatuses(from: ProjectStatus): ProjectStatus[] {
    return [...PROJECT_STATUSES].filter((to) => canTransition(from, to));
}
