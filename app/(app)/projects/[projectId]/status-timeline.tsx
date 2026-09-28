import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectStatusEvent } from "../queries";

export function StatusTimeline({ events }: { events: ProjectStatusEvent[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Status history</CardTitle>
            </CardHeader>
            <CardContent>
                {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No status history yet.</p>
                ) : (
                    <ol className="flex flex-col gap-1 text-sm text-muted-foreground">
                        {events.map((event) => (
                            <li key={event.id}>
                                {event.from_status === null
                                    ? `Created as ${event.to_status}`
                                    : `${event.from_status} → ${event.to_status}`}
                                {" "}
                                <time dateTime={event.changed_at}>
                                    {new Date(event.changed_at).toLocaleString()}
                                </time>
                            </li>
                        ))}
                    </ol>
                )}
            </CardContent>
        </Card>
    );
}
