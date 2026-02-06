"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { compareDates, formatLocalDate, timeToDateTime } from "@/utils/util";
import { addEvent } from "@/server-actions/supa";
import { useAlert } from "@/app/(alert)/AlertProvider";
import { useEventForm } from "@/hooks/useEventForm";
import { useMemberManagement } from "@/hooks/useMemberManagement";
import { FormFields } from "./FormFields";
import { MembersSection } from "./MembersSection";
import { MESSAGES } from "./messages";
import { EventInput } from "@/types/eventTypes";

export default function Page() {
  const params = useSearchParams();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { showAlert } = useAlert();

  const prefillDate = params.get("prefillDate") ?? formatLocalDate(new Date());
  const {
    formState,
    setFormField,
    validateForm,
    errors,
    isLoading,
    setIsLoading,
    isFormValid,
  } = useEventForm(prefillDate);

  const {
    members,
    emailInput,
    setEmailInput,
    addMembers,
    removeMember,
    isValidating,
    validationError,
  } = useMemberManagement();

  const handleValidateAndAddEmails = async () => {
    if (!emailInput.trim()) return;

    const emailList = emailInput
      .split(",")
      .map((email) => email.trim())
      .filter((email) => {
        return (
          email && !members.includes(email) && email !== session?.user.email
        );
      });

    if (emailList.length === 0) return;

    const result = await addMembers(emailList);

    if (result?.invalidEmails.length) {
      showAlert(MESSAGES.ALERT.INVALID_EMAILS(result.invalidEmails));
    }
  };

  const handleAddEvent = async (
    e: React.SubmitEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();

    if (!session?.user?.email) {
      showAlert(MESSAGES.ALERT.INVALID_SESSION);
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const selectedDate = new Date(formState.date);

      if (compareDates(selectedDate, new Date()) < 0) {
        showAlert({
          title: "Can not add Event in the past",
          type: "warning",
          description: "",
        });
        setIsLoading(false);
        return;
      }
      const mems = [...members, session.user.email];

      const sendEvent: EventInput = {
        title: formState.title,
        description: formState.description,
        date: selectedDate,
        from: timeToDateTime(selectedDate, formState.fromTime),
        to: formState.toTime
          ? timeToDateTime(selectedDate, formState.toTime)
          : null,
        userId: session.user.id,
      };

      const response = await addEvent(sendEvent, mems);

      if (!response.success || !response.data) {
        showAlert(MESSAGES.ALERT.EVENT_ADD_ERROR);
        setIsLoading(false);
        return;
      }

      showAlert(MESSAGES.ALERT.EVENT_ADD_SUCCESS);
      router.push(`/dashboard/events/${response.data.id}`);
    } catch (err) {
      console.error("Error adding event:", err);
      showAlert(MESSAGES.ALERT.EVENT_ADD_ERROR);
      setIsLoading(false);
    }
  };

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
            disabled={!isFormValid || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white disabled:text-zinc-300 font-semibold py-2 px-6 rounded-lg transition"
          >
            {isLoading ? "Adding Event..." : "Add Event"}
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800">
          <h1 className="text-3xl font-bold text-white mb-6">Create Event</h1>

          <form onSubmit={handleAddEvent} className="flex flex-col gap-6">
            <FormFields
              formState={formState}
              setFormField={setFormField}
              errors={errors}
            />

            <MembersSection
              members={members}
              sessionEmail={session?.user?.email}
              emailInput={emailInput}
              onEmailInputChange={setEmailInput}
              onAddMembers={handleValidateAndAddEmails}
              onRemoveMember={removeMember}
              isValidating={isValidating}
            />

            {validationError?.invalidEmails.length ? (
              <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded">
                Invalid emails: {validationError.invalidEmails.join(", ")}
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}
