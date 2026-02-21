"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

// Sample action items (will be replaced with real data later)
const SAMPLE_ACTION_ITEMS = [
  { id: 1, text: "Follow up on project requirements", completed: false },
  { id: 2, text: "Schedule next meeting", completed: true },
  { id: 3, text: "Send project proposal draft", completed: false },
  { id: 4, text: "Review budget allocation", completed: false },
];

interface ActionItem {
  id: number;
  text: string;
  completed: boolean;
}

export default function SmartNotesTab() {
  const [actionItems, setActionItems] =
    useState<ActionItem[]>(SAMPLE_ACTION_ITEMS);

  const toggleActionItem = (id: number) => {
    setActionItems(
      actionItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold mb-3">Action Items</h3>
        {actionItems.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={item.completed}
              onCheckedChange={() => toggleActionItem(item.id)}
              className="mt-0.5"
            />
            <span
              className={`text-sm flex-1 ${
                item.completed
                  ? "line-through text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {item.text}
            </span>
            {item.completed && (
              <Check className="h-4 w-4 text-green-500 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
