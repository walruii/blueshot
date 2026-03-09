"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageList } from "./MessageList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InboxItem } from "@/types/chat";
import { authClient } from "@/lib/auth-client";
import LoadingChatArea from "./LoadingChatArea";
import { useConversation } from "../_hooks/use-conversation";
import SummaryButton from "@/components/SummaryButton";
import { Settings, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { updateGroupConversationSettings } from "@/server-actions/conversations";
import { useChatStore } from "@/stores/chatStore";

export default function ChatArea({
  conversation,
}: {
  conversation: InboxItem;
}) {
  const id = conversation.id ?? "";
  const {
    messages,
    isLoadingOlder,
    hasMoreBefore,
    isInitialized,
    loadMoreRef,
    scrollContainerRef,
    sendMessage,
  } = useConversation(id);

  const { data: session } = authClient.useSession();
  const [input, setInput] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const shouldStickToBottomRef = useRef(true);

  const [groupName, setGroupName] = useState(
    conversation.type === "direct" ? "" : conversation.name || "Group",
  );
  const [groupAvatarUrl, setGroupAvatarUrl] = useState(
    conversation.type === "direct" ? "" : conversation.avatar_url || "",
  );
  const [groupDescription, setGroupDescription] = useState(
    conversation.type === "direct" ? "" : conversation.description || "",
  );
  const [settingsName, setSettingsName] = useState(groupName);
  const [settingsDescription, setSettingsDescription] =
    useState(groupDescription);
  const [settingsAvatarUrl, setSettingsAvatarUrl] = useState(groupAvatarUrl);

  const handleFormSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      sendMessage(trimmed);
      setInput("");
    }
  };

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 80;
  }, [scrollContainerRef]);

  useEffect(() => {
    shouldStickToBottomRef.current = true;
  }, [id]);

  useEffect(() => {
    if (conversation.type === "direct") return;
    const nextName = conversation.name || "Group";
    const nextDescription = conversation.description || "";
    const nextAvatar = conversation.avatar_url || "";
    setGroupName(nextName);
    setGroupDescription(nextDescription);
    setGroupAvatarUrl(nextAvatar);
    setSettingsName(nextName);
    setSettingsDescription(nextDescription);
    setSettingsAvatarUrl(nextAvatar);
  }, [conversation]);

  // auto-scroll only if user is already near bottom
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (!shouldStickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, scrollContainerRef]);

  // determine display values
  const isDirect = conversation.type === "direct";
  const image = isDirect
    ? conversation.partner_image || undefined
    : groupAvatarUrl || undefined;
  const name = isDirect
    ? conversation.partner_name || conversation.partner_email || "Unknown"
    : groupName || "Group";

  const handleOpenSettings = () => {
    if (isDirect) return;
    setSettingsName(groupName || "Group");
    setSettingsDescription(groupDescription || "");
    setSettingsAvatarUrl(groupAvatarUrl || "");
    setSettingsError(null);
    setIsSettingsOpen(true);
  };

  const canManageSettings =
    !isDirect &&
    (conversation.current_user_role === "admin" ||
      conversation.current_user_role === "owner");

  const handleSaveSettings = async () => {
    if (isDirect || !conversation.id) return;

    const nextName = settingsName.trim();
    if (!nextName) {
      setSettingsError("Group name is required");
      return;
    }

    setIsSavingSettings(true);
    setSettingsError(null);
    try {
      const result = await updateGroupConversationSettings({
        conversationId: conversation.id,
        name: nextName,
        description: settingsDescription.trim() || null,
        avatarUrl: settingsAvatarUrl.trim() || null,
      });

      if (!result.success || !result.data) {
        setSettingsError(
          result.success ? "Failed to update group" : result.error,
        );
        return;
      }

      setGroupName(result.data.name || nextName);
      setGroupDescription(result.data.description || "");
      setGroupAvatarUrl(result.data.avatar_url || "");
      useChatStore.getState().addGroupConversation(result.data);
      setIsSettingsOpen(false);
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (!conversation.id) {
    return <LoadingChatArea />;
  }

  return (
    <main className="flex-1 flex flex-col min-h-0">
      {/* Chat header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Avatar>
          {image && <AvatarImage src={image || ""} alt={name} />}
          <AvatarFallback>{name[0]?.toUpperCase() ?? "?"}</AvatarFallback>
        </Avatar>
        <span className="font-semibold">{name}</span>
        {canManageSettings && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            onClick={handleOpenSettings}
            title="Group chat settings"
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">Group chat settings</span>
          </Button>
        )}
      </div>
      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto p-6 bg-background min-h-0"
      >
        <div ref={loadMoreRef} className="h-px w-full shrink-0" />
        <MessageList
          messages={messages}
          currentUserId={session?.user?.id || ""}
          isLoadingOlder={isLoadingOlder}
          hasMoreBefore={hasMoreBefore}
          isInitialized={isInitialized}
        />
      </div>
      {/* AI Summary Button */}
      <div className="px-4 pt-2 shrink-0">
        <SummaryButton conversationId={id} />
      </div>
      {/* Input */}
      <form
        className="p-4 bg-card border-t border-border flex gap-2"
        onSubmit={handleFormSubmit}
      >
        <Input
          className="flex-1"
          placeholder="Type a message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button type="submit" variant="default">
          Send
        </Button>
      </form>

      {!isDirect && (
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Group Chat Settings</DialogTitle>
              <DialogDescription>
                Update chat-specific group name and avatar.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="group-chat-name">Group Name</Label>
                <Input
                  id="group-chat-name"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  placeholder="Group name"
                  disabled={isSavingSettings}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="group-chat-description">Description</Label>
                <Input
                  id="group-chat-description"
                  value={settingsDescription}
                  onChange={(e) => setSettingsDescription(e.target.value)}
                  placeholder="Optional description"
                  disabled={isSavingSettings}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="group-chat-avatar">Avatar URL</Label>
                <Input
                  id="group-chat-avatar"
                  value={settingsAvatarUrl}
                  onChange={(e) => setSettingsAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={isSavingSettings}
                />
              </div>

              {settingsError && (
                <p className="text-xs font-medium text-destructive">
                  {settingsError}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsSettingsOpen(false)}
                disabled={isSavingSettings}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
