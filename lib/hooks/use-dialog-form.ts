/**
 * 공통 다이얼로그 폼 관리 훅
 * 중복된 다이얼로그/폼 관리 패턴을 통합
 */

import { useState, useCallback } from "react";

interface UseDialogFormOptions<T> {
  onSuccess?: () => void;
}

interface UseDialogFormResult<T> {
  showDialog: boolean;
  editingItem: T | undefined;
  openDialog: (item?: T) => void;
  closeDialog: () => void;
  handleSuccess: () => void;
}

export function useDialogForm<T = any>(
  options: UseDialogFormOptions<T> = {}
): UseDialogFormResult<T> {
  const { onSuccess } = options;

  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<T | undefined>(undefined);

  const openDialog = useCallback((item?: T) => {
    setEditingItem(item);
    setShowDialog(true);
  }, []);

  const closeDialog = useCallback(() => {
    setShowDialog(false);
    setEditingItem(undefined);
  }, []);

  const handleSuccess = useCallback(() => {
    closeDialog();
    onSuccess?.();
  }, [closeDialog, onSuccess]);

  return {
    showDialog,
    editingItem,
    openDialog,
    closeDialog,
    handleSuccess,
  };
}

