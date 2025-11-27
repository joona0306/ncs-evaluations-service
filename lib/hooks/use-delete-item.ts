/**
 * 공통 삭제 기능 훅
 * 중복된 삭제 패턴을 통합
 */

import { useState, useCallback } from "react";
import { parseApiResponse, getErrorMessage } from "@/lib/utils/api-helpers";

interface UseDeleteItemOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  confirmMessage?: string;
}

interface UseDeleteItemResult {
  deleteItem: (apiUrl: string, itemName?: string) => Promise<boolean>;
  deleting: boolean;
}

export function useDeleteItem(
  options: UseDeleteItemOptions = {}
): UseDeleteItemResult {
  const {
    onSuccess,
    onError,
    confirmMessage = "이 항목을 삭제하시겠습니까?",
  } = options;

  const [deleting, setDeleting] = useState(false);

  const deleteItem = useCallback(
    async (apiUrl: string, itemName?: string): Promise<boolean> => {
      const message = itemName
        ? `${itemName}을(를) ${confirmMessage}`
        : confirmMessage;

      if (!confirm(message)) {
        return false;
      }

      setDeleting(true);

      try {
        const response = await fetch(apiUrl, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "삭제에 실패했습니다.");
        }

        await parseApiResponse(response);
        onSuccess?.();
        return true;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        const error = err instanceof Error ? err : new Error(errorMessage);
        onError?.(error);
        alert(errorMessage);
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [confirmMessage, onSuccess, onError]
  );

  return {
    deleteItem,
    deleting,
  };
}

