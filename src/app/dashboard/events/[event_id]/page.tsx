import { getEvent } from "@/server-actions/supa";
import { authClient } from "@/lib/auth-client";
import { dateToTimeString, formatLocalDate } from "@/utils/util";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// TODO: Create backend function to fetch members with their email status
// Expected return type: { email: string, mailSent: boolean, acknowledged: boolean }[]
async function getEventMembers(eventId: string) {
  // Placeholder - implement backend call
  return [];
}

export default async function Page({
  params,
}: {
  params: { event_id: string };
}) {
  const { event_id } = await params;
  const event = await getEvent(event_id);

  // TODO: Get current session to check if user is creator
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });
  const isCreator = session?.user?.id === event?.userId;

  // TODO: Fetch members with their status
  const members = await getEventMembers(event_id);

  if (!event) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white text-xl">Event not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/dashboard"
            className="inline-block bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            ← Back to Dashboard
          </a>
        </div>

        {/* Event Details Card */}
        <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 mb-6">
          <h1 className="text-4xl font-bold text-white mb-6">{event.title}</h1>

          {/* Event Info Grid */}
          <div className="space-y-4">
            {/* Description */}
            <div>
              <label className="text-zinc-400 text-sm font-medium block mb-2">
                Description
              </label>
              <p className="text-white text-lg">{event.description}</p>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-zinc-400 text-sm font-medium block mb-2">
                  Date
                </label>
                <p className="text-white text-lg">
                  {formatLocalDate(event.date)}
                </p>
              </div>
              <div>
                <label className="text-zinc-400 text-sm font-medium block mb-2">
                  From
                </label>
                <p className="text-white text-lg">
                  {dateToTimeString(event.from)}
                </p>
              </div>
              <div>
                <label className="text-zinc-400 text-sm font-medium block mb-2">
                  To
                </label>
                <p className="text-white text-lg">
                  {event.to ? dateToTimeString(event.to) : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800">
          <h2 className="text-2xl font-bold text-white mb-6">Event Members</h2>

          {isCreator ? (
            /* Creator View - Shows mail status and acknowledgment */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left text-zinc-400 font-medium py-3 px-4">
                      Member Email
                    </th>
                    <th className="text-center text-zinc-400 font-medium py-3 px-4">
                      Mail Sent
                    </th>
                    <th className="text-center text-zinc-400 font-medium py-3 px-4">
                      Acknowledged
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center text-zinc-500 py-8"
                      >
                        No members yet
                      </td>
                    </tr>
                  ) : (
                    members.map((member: any) => (
                      <tr
                        key={member.email}
                        className="border-b border-zinc-800 hover:bg-zinc-800/50 transition"
                      >
                        <td className="text-white py-4 px-4">{member.email}</td>
                        <td className="text-center py-4 px-4">
                          {member.mailSent ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-900/30 text-green-400">
                              ✓ Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-900/30 text-red-400">
                              ✗ Not Sent
                            </span>
                          )}
                        </td>
                        <td className="text-center py-4 px-4">
                          {member.acknowledged ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-900/30 text-blue-400">
                              ✓ Acknowledged
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-zinc-700 text-zinc-400">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Regular Member View - Simple list */
            <div className="space-y-2">
              {members.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">
                  No members in this event
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {members.map((member: any) => (
                    <div
                      key={member.email}
                      className="bg-zinc-800 text-white px-4 py-2 rounded-full text-sm"
                    >
                      {member.email}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
