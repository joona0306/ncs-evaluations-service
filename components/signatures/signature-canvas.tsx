"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

export function SignatureCanvasComponent({ onSave, onCancel }: SignatureCanvasProps) {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

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

