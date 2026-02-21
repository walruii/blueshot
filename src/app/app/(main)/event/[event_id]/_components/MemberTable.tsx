import { Badge } from "@/components/ui/badge";
import { EventMember } from "@/types/userEventState";

export default function MemberTable({
  eventMembers,
  permissions,
  event,
}: {
  eventMembers: EventMember[];
  permissions: any;
  event: any;
}) {
  return permissions.canManageAccess ? (
    /* Creator View - Shows mail status and acknowledgment */
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left text-muted-foreground font-medium py-3 px-4">
              Member Email
            </th>
            <th className="text-center text-muted-foreground font-medium py-3 px-4">
              Notification Sent
            </th>
            <th className="text-center text-muted-foreground font-medium py-3 px-4">
              Acknowledged
            </th>
          </tr>
        </thead>
        <tbody>
          {eventMembers.length === 0 ? (
            <tr>
              <td
                colSpan={3}
                className="text-center text-muted-foreground py-8"
              >
                No members yet
              </td>
            </tr>
          ) : (
            eventMembers.map((m: EventMember) => {
              return (
                <tr
                  key={m.id}
                  className="border-b hover:bg-muted/50 transition"
                >
                  <td className="py-4 px-4">{m.userEmail}</td>
                  {m.userId !== event.createdBy && (
                    <>
                      <td className="text-center py-4 px-4">
                        {m.eventSentAt ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-500/20 text-green-400"
                          >
                            ✓ Sent
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-destructive/20 text-destructive"
                          >
                            ✗ Not Sent
                          </Badge>
                        )}
                      </td>
                      <td className="text-center py-4 px-4">
                        {m.acknowledgedAt ? (
                          <Badge
                            variant="secondary"
                            className="bg-primary/20 text-primary"
                          >
                            ✓ Acknowledged
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  ) : (
    /* Regular Member View - Simple list */
    <div className="space-y-2">
      {eventMembers.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No members in this event
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {eventMembers.map((m: EventMember) => (
            <Badge key={m.id} variant="secondary">
              {m.userEmail}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
