import { useState, useCallback, useMemo } from "react";

export interface PendingChange {
  id: string;
  [key: string]: any;
}

/**
 * Generic hook for managing pending changes with idempotency checks.
 * Handles: tracking changes, duplicate detection, computing effective state.
 */
export function usePendingChanges<T extends PendingChange>(
  computeEffectiveStateFn: (pendingChanges: T[]) => Record<string, any>,
) {
  const [pendingChanges, setPendingChanges] = useState<T[]>([]);

  // Add a change with duplicate detection callback
  const addChange = useCallback(
    (
      change: T,
      shouldAdd: (changes: T[], newChange: T) => boolean = () => true,
    ) => {
      if (shouldAdd(pendingChanges, change)) {
        setPendingChanges((prev) => [...prev, change]);
        return true;
      }
      return false;
    },
    [pendingChanges],
  );

  // Remove a specific change by ID
  const removeChange = useCallback((changeId: string) => {
    setPendingChanges((prev) => prev.filter((c) => c.id !== changeId));
  }, []);

  // Update a specific change
  const updateChange = useCallback((changeId: string, updated: T) => {
    setPendingChanges((prev) =>
      prev.map((c) => (c.id === changeId ? updated : c)),
    );
  }, []);

  // Filter and keep only changes that match a predicate
  const keepOnly = useCallback((predicate: (change: T) => boolean) => {
    setPendingChanges((prev) => prev.filter(predicate));
  }, []);

  // Clear all pending changes
  const discardAll = useCallback(() => {
    setPendingChanges([]);
  }, []);

  // Compute effective state using provided function
  const effectiveState = useMemo(() => {
    return computeEffectiveStateFn(pendingChanges);
  }, [pendingChanges, computeEffectiveStateFn]);

  const hasPendingChanges = pendingChanges.length > 0;

  return {
    pendingChanges,
    setPendingChanges,
    addChange,
    removeChange,
    updateChange,
    keepOnly,
    discardAll,
    effectiveState,
    hasPendingChanges,
  };
}
