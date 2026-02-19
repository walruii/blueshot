import { useState, useCallback } from "react";
import { useAlert } from "@/components/AlertProvider";

export interface SaveResult {
  successCount: number;
  totalCount: number;
  failedChanges: { description: string; error: string }[];
}

/**
 * Generic hook for orchestrating batch save and refresh operations.
 * Handles: save loading state, result display, server refresh, error handling.
 */
export function useSaveAndRefresh() {
  const [isSaving, setIsSaving] = useState(false);
  const [resultData, setResultData] = useState<SaveResult>({
    successCount: 0,
    totalCount: 0,
    failedChanges: [],
  });
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);

  const { showAlert } = useAlert();

  // Execute save operation with error handling
  const executeSave = useCallback(
    async <T>(
      saveFn: () => Promise<{ success: boolean; data?: T; error?: string }>,
      onSuccess?: (data: T) => void,
      onError?: (error: string) => void,
    ) => {
      setIsSaving(true);
      try {
        const result = await saveFn();

        if (result.success && result.data) {
          onSuccess?.(result.data);
          return true;
        } else {
          const errorMsg = result.error || "Failed to save changes";
          onError?.(errorMsg);
          showAlert({
            title: "Failed to save changes",
            description: errorMsg,
            type: "error",
          });
          return false;
        }
      } finally {
        setIsSaving(false);
      }
    },
    [showAlert],
  );

  // Display save result
  const displayResult = useCallback((result: SaveResult) => {
    setResultData(result);
    setIsResultDialogOpen(true);
  }, []);

  // Close result dialog
  const closeResultDialog = useCallback(() => {
    setIsResultDialogOpen(false);
  }, []);

  return {
    isSaving,
    resultData,
    isResultDialogOpen,
    setIsResultDialogOpen,
    displayResult,
    closeResultDialog,
    executeSave,
  };
}
