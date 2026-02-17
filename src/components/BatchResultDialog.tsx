"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface FailedChange {
  description: string;
  error: string;
}

interface BatchResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  successCount: number;
  totalCount: number;
  failedChanges: FailedChange[];
}

export function BatchResultDialog({
  isOpen,
  onClose,
  successCount,
  totalCount,
  failedChanges,
}: BatchResultDialogProps) {
  const allSucceeded = failedChanges.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {allSucceeded ? (
              <CheckCircle2 className="size-5 text-green-500" />
            ) : (
              <AlertTriangle className="size-5 text-yellow-500" />
            )}
            <DialogTitle>
              {allSucceeded ? "Changes Saved" : "Changes Partially Saved"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {successCount} of {totalCount} change
            {totalCount !== 1 ? "s" : ""} applied successfully
          </DialogDescription>
        </DialogHeader>

        {failedChanges.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-destructive">
              Failed changes:
            </p>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {failedChanges.map((failed, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm"
                >
                  <p className="font-medium">{failed.description}</p>
                  <p className="text-muted-foreground text-xs">
                    {failed.error}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
