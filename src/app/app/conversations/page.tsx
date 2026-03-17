import NewConversation from "./_components/NewConversation";

export default function Page() {
  return (
    <div className="flex-col flex-1 flex items-center justify-center">
      <p className="text-muted-foreground">
        Select a conversation to start chatting!
      </p>
      <NewConversation />
    </div>
  );
}
