import { Card, CardContent } from "@/components/ui/card";

interface GroupEmptyStateProps {
  message: string;
  actionPrompt: string;
}

export function GroupEmptyState({
  message,
  actionPrompt,
}: GroupEmptyStateProps) {
  return (
    <Card className="text-center">
      <CardContent className="py-8">
        <p className="text-muted-foreground">{message}</p>
        <p className="mt-2 text-sm text-muted-foreground">{actionPrompt}</p>
      </CardContent>
    </Card>
  );
}
