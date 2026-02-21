import { ChatContainer } from "./_components/ChatContainer";
import {
  getConversation,
  createDirectConversation,
} from "@/server-actions/chat";
import { notFound } from "next/navigation";

interface ChatPageProps {
  params: { type: string; id: string };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { type, id } = await params;
  let conversationId: string;

  if (type === "direct") {
    const result = await createDirectConversation(id);
    if (!result.success) return notFound();
    conversationId = result.data.id;
  } else {
    conversationId = id;
  }

  const result = await getConversation(conversationId);
  if (!result.success) return notFound();

  return <ChatContainer conversation={result.data} />;
}
