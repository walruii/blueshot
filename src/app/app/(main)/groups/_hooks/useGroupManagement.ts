import { useState, useEffect } from "react";
import { useAlert } from "@/components/AlertProvider";

/**
 * Generic hook for managing group selection and UI modal states.
 * Handles: loading groups, selecting/switching groups, and modal visibility states.
 */
export function useGroupManagement<T extends { id: string }>(
  loadGroupsFn: () => Promise<{ success: boolean; data?: T[]; error?: string }>,
) {
  // Group selection state
  const [groups, setGroups] = useState<T[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<T | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);

  const { showAlert } = useAlert();

  // Load groups on mount
  useEffect(() => {
    async function load() {
      setLoadingGroups(true);
      const result = await loadGroupsFn();
      if (result.success && result.data) {
        setGroups(result.data);
      } else if (!result.success) {
        showAlert({
          title: "Failed to load groups",
          description: result.error,
          type: "error",
        });
      }
      setLoadingGroups(false);
    }
    load();
  }, [loadGroupsFn, showAlert]);

  // Handle group selection and update selectedGroup
  useEffect(() => {
    if (!selectedGroupId) {
      setSelectedGroup(null);
      return;
    }
    const group = groups.find((g) => g.id === selectedGroupId);
    setSelectedGroup(group || null);
  }, [selectedGroupId, groups]);

  const handleGroupCreated = (newGroup: T) => {
    setGroups((prev) => [...prev, newGroup]);
    setSelectedGroupId(newGroup.id);
    setIsCreateModalOpen(false);
  };

  const handleGroupsRefresh = (updatedGroups: T[]) => {
    setGroups(updatedGroups);
  };

  const clearSelection = () => {
    setSelectedGroupId("");
    setSelectedGroup(null);
  };

  return {
    // Group data
    groups,
    selectedGroupId,
    selectedGroup,
    loadingGroups,
    // Group management
    setSelectedGroupId,
    handleGroupCreated,
    handleGroupsRefresh,
    clearSelection,
    // Modal states
    isCreateModalOpen,
    setIsCreateModalOpen,
    isGroupSettingsOpen,
    setIsGroupSettingsOpen,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    isResultDialogOpen,
    setIsResultDialogOpen,
  };
}
