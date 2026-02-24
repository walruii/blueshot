"use client";

import { useState } from "react";
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
import { createDirectConversation } from "@/server-actions/conversations";
import type { Result } from "@/types/returnType";

export default function NewConversation({
  onConversationCreated,
}: {
  onConversationCreated?: (conversationId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-100">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const trimmed = email.trim();
            if (!trimmed || isSubmitting) return;

            setIsSubmitting(true);
            setError(null);
            try {
              const result: Result<string> =
                await createDirectConversation(trimmed);
              if (!result.success) {
                setError(result.error);
                return;
              }

              const conversationId = result.data;
              if (conversationId) onConversationCreated?.(conversationId);

              setOpen(false);
              setEmail("");
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
            <DialogDescription>
              Start a direct message by entering a user's email address.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
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

              {/* Server-side errors show up here */}
              {error && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {error}
                </p>
              )}
            </div>
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
                  Creating...
                </>
              ) : (
                "Create Chat"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
