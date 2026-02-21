import { ConversationsList } from "@/app/app/_components/ConversationsList";

export default function ConversationsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Conversations</h1>
      <ConversationsList />
    </div>
  );
}
