"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignatureUploadProps {
  onSave: (file: File) => void;
  onCancel: () => void;
}

export function SignatureUpload({ onSave, onCancel }: SignatureUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // 이미지 파일만 허용
      if (!selectedFile.type.startsWith("image/")) {
        alert("이미지 파일만 업로드 가능합니다.");
        return;
      }

      // 파일 크기 제한 (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("파일 크기는 5MB 이하여야 합니다.");
        return;
      }

      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSave = () => {
    if (file) {
      onSave(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signature-file">서명 이미지 선택</Label>
        <Input
          id="signature-file"
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <p className="text-sm text-muted-foreground">
          JPG, PNG 형식의 이미지 파일만 업로드 가능합니다. (최대 5MB)
        </p>
      </div>

      {preview && (
        <div className="border rounded-lg p-4 bg-white">
          <Image
            src={preview}
            alt="서명 미리보기"
            width={400}
            height={256}
            className="max-w-full h-auto max-h-64 mx-auto"
            unoptimized
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={!file} className="flex-1">
          서명 저장
        </Button>
        <Button onClick={onCancel} variant="outline">
          취소
        </Button>
      </div>
    </div>
  );
}

