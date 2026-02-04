"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { formatLocalDate } from "@/utils/util";

export default function Page() {
  const params = useSearchParams();
  console.log(params);
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(
    params.get("prefillDate") ?? formatLocalDate(new Date()),
  );
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validatingEmails, setValidatingEmails] = useState(false);

  // Initialize members with session user's email
  useEffect(() => {
    if (session?.user?.email && members.length === 0) {
      setMembers([session.user.email]);
    }
  }, [session, members.length]);

  const validateAndAddEmails = async () => {
    if (!emailInput.trim()) return;

    setValidatingEmails(true);
    const emailList = emailInput
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email && !members.includes(email));

    // TODO: Call backend to validate emails exist in system
    // For now, we'll just add them directly
    // const validEmails = await checkEmailsExist(emailList);

    setMembers([...members, ...emailList]);
    setEmailInput("");
    setValidatingEmails(false);
  };

  const removeMember = (email: string) => {
    // Don't remove the session user's email
    if (email === session?.user?.email) return;
    setMembers(members.filter((m) => m !== email));
  };

  const handleAddEvent = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // TODO: Submit event to backend with all the data
    // Including title, description, date, fromTime, toTime, and members array
    console.log({
      title,
      description,
      date,
      fromTime,
      toTime,
      members,
    });

    setLoading(false);
    // router.push("/");
  };

  const isFormValid =
    title.trim() !== "" &&
    description.trim() !== "" &&
    date !== "" &&
    fromTime !== "" &&
    toTime !== "" &&
    members.length > 0;

  return (
    <div className="min-h-screen bg-zinc-950 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Go Back and Add buttons */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.back()}
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            ← Go Back
          </button>
          <button
            onClick={handleAddEvent}
            disabled={!isFormValid || loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            {loading ? "Adding Event..." : "Add Event"}
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800">
          <h1 className="text-3xl font-bold text-white mb-6">Create Event</h1>

          {error && (
            <div className="text-red-400 text-sm mb-4 bg-red-900/20 p-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleAddEvent} className="flex flex-col gap-6">
            {/* Title */}
            <div>
              <label className="text-white text-sm block mb-2 font-medium">
                Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter event title"
                className="w-full px-4 py-2 rounded bg-zinc-800 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-white text-sm block mb-2 font-medium">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter event description"
                rows={4}
                className="w-full px-4 py-2 rounded bg-zinc-800 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-white text-sm block mb-2 font-medium">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm block mb-2 font-medium">
                  From (Time) *
                </label>
                <input
                  type="time"
                  value={fromTime}
                  onChange={(e) => setFromTime(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-white text-sm block mb-2 font-medium">
                  To (Time) *
                </label>
                <input
                  type="time"
                  value={toTime}
                  onChange={(e) => setToTime(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Members Section */}
            <div>
              <label className="text-white text-sm block mb-2 font-medium">
                Add Members
              </label>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter emails separated by commas (e.g., user1@example.com, user2@example.com)"
                  className="flex-1 px-4 py-2 rounded bg-zinc-800 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={validateAndAddEmails}
                  disabled={validatingEmails || !emailInput.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  {validatingEmails ? "Checking..." : "Add"}
                </button>
              </div>

              {/* Members List */}
              <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                <p className="text-zinc-400 text-sm mb-3">
                  Members ({members.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {members.map((email) => (
                    <div
                      key={email}
                      className="bg-zinc-700 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      <span>{email}</span>
                      {email !== session?.user?.email && (
                        <button
                          type="button"
                          onClick={() => removeMember(email)}
                          className="hover:text-red-400 transition"
                        >
                          ×
                        </button>
                      )}
                      {email === session?.user?.email && (
                        <span className="text-xs text-blue-400">(You)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
