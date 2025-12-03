"use client";

import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

export function SignatureCanvasComponent({
  onSave,
  onCancel,
}: SignatureCanvasProps) {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // hydration mismatch 방지
  useEffect(() => {
    setMounted(true);
  }, []);

  // 다크모드 감지 (resolvedTheme 사용)
  const isDarkMode = mounted && (resolvedTheme === "dark" || theme === "dark");
  const penColor = isDarkMode ? "#ffffff" : "#000000"; // 다크모드: 흰색, 라이트모드: 검은색

  const handleClear = () => {
    sigCanvasRef.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      const dataUrl = sigCanvasRef.current.toDataURL();
      onSave(dataUrl);
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
        <SignatureCanvas
          ref={sigCanvasRef}
          canvasProps={{
            className: "w-full h-64",
          }}
          penColor={penColor}
          backgroundColor={isDarkMode ? "#111827" : "#ffffff"} // 다크모드: dark:bg-gray-900, 라이트모드: white
          onBegin={handleBegin}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleClear} variant="outline">
          지우기
        </Button>
        <Button onClick={handleSave} disabled={isEmpty} className="flex-1">
          서명 저장
        </Button>
        <Button onClick={onCancel} variant="outline">
          취소
        </Button>
      </div>
    </div>
  );
}
