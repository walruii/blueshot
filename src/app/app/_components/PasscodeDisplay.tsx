"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { useAlert } from "@/components/AlertProvider";

interface PasscodeDisplayProps {
  passcode: string;
  isAdmin: boolean;
}

export default function PasscodeDisplay({
  passcode,
  isAdmin,
}: PasscodeDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { showAlert } = useAlert();

  if (!isAdmin || !passcode) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(passcode);
      setIsCopied(true);
      showAlert({
        title: "Passcode copied to clipboard!",
        type: "success",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy passcode:", err);
      showAlert({
        title: "Failed to copy passcode",
        type: "error",
      });
    }
  };

  return (
    <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-muted-foreground/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="text-muted-foreground text-sm font-medium block mb-2">
            Guest Passcode
          </label>
          <div className="flex items-center gap-2">
            <div className="font-mono text-lg font-bold tracking-wider bg-background px-4 py-2 rounded min-w-40">
              {isVisible ? (
                <span>{passcode}</span>
              ) : (
                <span className="text-muted-foreground">••••••</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
              title={isVisible ? "Hide passcode" : "Show passcode"}
            >
              {isVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Share this passcode with guests to allow them to join the meeting
            without an account.
          </p>
        </div>
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className="shrink-0"
          title="Copy passcode to clipboard"
        >
          {isCopied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
