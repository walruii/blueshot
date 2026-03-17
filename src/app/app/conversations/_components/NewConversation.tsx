"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createDirectConversation,
  createEventGroupConversation,
  createUserGroupConversation,
  getDirectConversationById,
  getGroupConversationById,
} from "@/server-actions/conversations";
import { getAccessibleUserGroups } from "@/server-actions/userGroup";
import { getAccessibleEventGroups } from "@/server-actions/eventGroup";
import { useChatStore } from "@/stores/chatStore";
import type { Result } from "@/types/returnType";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import type { UserGroup } from "@/types/userGroup";
import type { EventGroup } from "@/types/eventGroup";
import { CreateUserGroupModal } from "@/components/CreateUserGroupModal";
import { CreateEventGroupModal } from "@/components/CreateEventGroupModal";

export default function NewConversation() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"direct" | "user_group" | "event_group">(
    "direct",
  );
  const [email, setEmail] = useState("");
  const [selectedUserGroupId, setSelectedUserGroupId] = useState("");
  const [selectedEventGroupId, setSelectedEventGroupId] = useState("");
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isCreateUserGroupModalOpen, setIsCreateUserGroupModalOpen] =
    useState(false);
  const [isCreateEventGroupModalOpen, setIsCreateEventGroupModalOpen] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { data: session } = authClient.useSession();

  const loadGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const [usersRes, eventsRes] = await Promise.all([
        getAccessibleUserGroups(),
        getAccessibleEventGroups(),
      ]);

      setUserGroups(usersRes.success ? usersRes.data || [] : []);
      setEventGroups(eventsRes.success ? eventsRes.data || [] : []);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    loadGroups();
  }, [open]);

  const onConversationCreated = async (
    conversationId: string,
    type: "direct" | "group",
  ) => {
    // close dialog right away so UI feels responsive
    setOpen(false);
    setEmail("");
    setSelectedUserGroupId("");
    setSelectedEventGroupId("");
    setMode("direct");

    // navigate and then explicitly refresh server data so the sidebar layout
    // query runs again and includes the new conversation.  pushing to the new
    // route does not automatically re-run the parent layout when the path
    // stays within the same segment, so we need the extra refresh call.
    await router.push(
      type === "direct"
        ? `/app/conversations/d/${conversationId}`
        : `/app/conversations/g/${conversationId}`,
    );
    router.refresh();

    // update zustand for components that may read from the store (e.g. if the
    // user stays on the same page due to an error not navigating) – harmless
    // but ensures the in‑memory cache is in sync.
    try {
      if (type === "direct") {
        const conv = await getDirectConversationById(conversationId);
        if (conv?.id) {
          useChatStore.getState().addDirectConversation(conv);
        }
      } else {
        const conv = await getGroupConversationById(conversationId);
        if (conv?.id) {
          useChatStore.getState().addGroupConversation(conv);
        }
      }
    } catch (err) {
      console.error("failed to fetch new conversation", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 w-full px-3 justify-center flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Conversation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-100">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (isSubmitting) return;

            setIsSubmitting(true);
            setError(null);
            try {
              let result: Result<string>;

              if (mode === "direct") {
                const trimmed = email.trim();
                if (!trimmed) return;
                result = await createDirectConversation(trimmed);
              } else if (mode === "user_group") {
                if (!selectedUserGroupId) {
                  setError("Please select a user group");
                  return;
                }
                result = await createUserGroupConversation({
                  userGroupId: selectedUserGroupId,
                });
              } else {
                if (!selectedEventGroupId) {
                  setError("Please select an event group");
                  return;
                }
                result = await createEventGroupConversation({
                  eventGroupId: selectedEventGroupId,
                });
              }

              if (!result.success) {
                setError(result.error);
                return;
              }

              const conversationId = result.data;
              if (conversationId) {
                await onConversationCreated(
                  conversationId,
                  mode === "direct" ? "direct" : "group",
                );
              }
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Start Chat</DialogTitle>
            <DialogDescription>
              Start a direct chat, user-group chat, or event-group chat.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Tabs
              value={mode}
              onValueChange={(value) =>
                setMode(value as "direct" | "user_group" | "event_group")
              }
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="direct">Direct</TabsTrigger>
                <TabsTrigger value="user_group">User Group</TabsTrigger>
                <TabsTrigger value="event_group">Event Group</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-4 py-4">
            {mode === "direct" ? (
              <div className="grid gap-2">
                <Label htmlFor="email">Recipient Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-9"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            ) : mode === "user_group" ? (
              <div className="grid gap-3">
                <Label>User Group</Label>
                <Select
                  value={selectedUserGroupId}
                  onValueChange={setSelectedUserGroupId}
                  disabled={isLoadingGroups || isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user group" />
                  </SelectTrigger>
                  <SelectContent>
                    {userGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateUserGroupModalOpen(true)}
                  disabled={isSubmitting}
                >
                  Create User Group
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                <Label>Event Group</Label>
                <Select
                  value={selectedEventGroupId}
                  onValueChange={setSelectedEventGroupId}
                  disabled={isLoadingGroups || isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event group" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateEventGroupModalOpen(true)}
                  disabled={isSubmitting}
                >
                  Create Event Group
                </Button>
              </div>
            )}

            {/* Server-side errors show up here */}
            {error && (
              <p className="text-xs font-medium text-destructive mt-1">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                "Start Chat"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {session?.user?.id && (
        <CreateUserGroupModal
          isOpen={isCreateUserGroupModalOpen}
          onClose={() => setIsCreateUserGroupModalOpen(false)}
          onCreated={(group) => {
            setUserGroups((prev) => [
              group,
              ...prev.filter((g) => g.id !== group.id),
            ]);
            setSelectedUserGroupId(group.id);
            setMode("user_group");
            setIsCreateUserGroupModalOpen(false);
          }}
          userId={session.user.id}
        />
      )}

      {session?.user?.id && (
        <CreateEventGroupModal
          isOpen={isCreateEventGroupModalOpen}
          onClose={() => setIsCreateEventGroupModalOpen(false)}
          onCreated={(group) => {
            setEventGroups((prev) => [
              group,
              ...prev.filter((g) => g.id !== group.id),
            ]);
            setSelectedEventGroupId(group.id);
            setMode("event_group");
            setIsCreateEventGroupModalOpen(false);
          }}
          userId={session.user.id}
          userEmail={session.user.email}
          availableUserGroups={userGroups}
          onCreateUserGroup={() => {
            setIsCreateEventGroupModalOpen(false);
            setIsCreateUserGroupModalOpen(true);
          }}
        />
      )}
    </Dialog>
  );
}
