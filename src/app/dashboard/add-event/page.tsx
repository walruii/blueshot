"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { formatLocalDate, timeToDateTime } from "@/utils/util";
import { addEvent, checkEmailListExist } from "@/server-actions/supa";
import { useAlert } from "@/app/(alert)/AlertProvider";
import { TEventDTO } from "@/types/eventTypes";
import { success } from "zod";

export default function Page() {
  const params = useSearchParams();
  const router = useRouter();
  const { data: session } = authClient.useSession();

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
  const { showAlert } = useAlert();

  const validateAndAddEmails = async () => {
    if (!emailInput.trim()) return;

    setValidatingEmails(true);
    const emailList = emailInput
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email && !members.includes(email));

    if (emailList.length === 0) {
      setValidatingEmails(false);
      return;
    }
    const res = await checkEmailListExist(emailList);

    if (!res || !res.success || !res.data) {
      showAlert({
        title: "Error Validating Emails",
        description: "Try again after some time",
        type: "warning",
      });
      setValidatingEmails(false);
      return;
    }

    const validEmailList: string[] = [];
    const invalidEmailList: string[] = [];
    res.data.forEach((e) => {
      if (e.exist) validEmailList.push(e.email);
      else invalidEmailList.push(e.email);
    });

    if (validEmailList.length > 0) {
      setMembers([...members, ...validEmailList]);
      setEmailInput("");
    }

    if (invalidEmailList.length > 0) {
      showAlert({
        title: "Some Emails Not Found",
        description: `The following emails don't exist: ${invalidEmailList.join(", ")}`,
        type: "warning",
      });
    }

    setValidatingEmails(false);
  };

  const removeMember = (email: string) => {
    if (email === session?.user?.email) return;
    setMembers(members.filter((m) => m !== email));
  };

  const handleAddEvent = async (
    e: React.SubmitEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);

      if (!session || !session.user || !session.user.email) {
        showAlert({
          title: "Invalid Session",
          type: "error",
          description: "Your browser session is invaild remove cache",
        });
        setLoading(false);
        return;
      }

      const mems = [...members, session.user.email];

      // TODO: Submit event to backend with all the data
      // Including title, description, date, fromTime, toTime, and members array
      const selectedDate = new Date(date);
      const sendEvent: TEventDTO = {
        title: title,
        description: description,
        date: selectedDate,
        to: timeToDateTime(selectedDate, toTime),
        from: timeToDateTime(selectedDate, fromTime),
        userId: session.user.id,
      };
      const response = await addEvent(sendEvent, mems);
      if (!response.success || !response.data) {
        showAlert({
          title: "Unable to Add Event",
          type: "error",
          description: "Try Again Later",
        });
        setLoading(false);
        return;
      }
      setLoading(false);
      showAlert({
        title: "Event Added Successfully",
        type: "info",
        description: "",
      });
      router.push(`/dashboard/events/${response.data.id}`);
    } catch (err) {
      console.error(err);
      return {
        success: false,
        error: "Internal Server Error",
      };
    }
  };

  const isFormValid =
    title.trim() !== "" &&
    description.trim() !== "" &&
    date !== "" &&
    fromTime !== "";

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
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white disabled:text-zinc-300 font-semibold py-2 px-6 rounded-lg transition"
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
                  To (Time)
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
                  Members ({members.length + 1})
                </p>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-zinc-700 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    <span className="text-xs text-blue-400">(You)</span>
                  </div>
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
