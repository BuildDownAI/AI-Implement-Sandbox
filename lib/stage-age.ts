export function formatStageAge(statusChangedAt: string | null, now: Date): string {
    if (!statusChangedAt) return "In this stage since today";
    const changedAt = new Date(statusChangedAt);
    const days = Math.floor((now.getTime() - changedAt.getTime()) / 86_400_000);
    if (days <= 0) return "In this stage since today";
    if (days === 1) return "In this stage for 1 day";
    return `In this stage for ${days} days`;
}
