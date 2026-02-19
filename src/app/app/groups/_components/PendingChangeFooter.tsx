import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Save } from "lucide-react";

interface PendingChangeFooterProps {
  pendingChangesCount: number;
  onSave: () => void;
  onDiscard: () => void;
  isSaving: boolean;
}

export function PendingChangeFooter({
  pendingChangesCount,
  onSave,
  onDiscard,
  isSaving,
}: PendingChangeFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
        <p className="text-sm text-muted-foreground">
          {pendingChangesCount} pending change
          {pendingChangesCount !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onDiscard} disabled={isSaving}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Discard
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
