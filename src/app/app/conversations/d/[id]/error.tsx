"use client";

export default function DirectConversationError({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-destructive">
        Something went wrong loading this conversation.
      </p>
    </div>
  );
}
