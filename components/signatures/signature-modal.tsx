"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignatureCanvasComponent } from "./signature-canvas";
import { SignatureUpload } from "./signature-upload";

interface SignatureModalProps {
  evaluationId: string;
  signerId: string;
  signerRole: "teacher" | "student" | "admin";
  signatureId?: string; // 수정 모드일 때 기존 서명 ID
  onSuccess: () => void;
  onCancel: () => void;
}

export function SignatureModal({
  evaluationId,
  signerId,
  signerRole,
  signatureId,
  onSuccess,
  onCancel,
}: SignatureModalProps) {
  const [mode, setMode] = useState<"select" | "canvas" | "upload">("select");
  const [loading, setLoading] = useState(false);

  const handleCanvasSave = async (dataUrl: string) => {
    await saveSignature(dataUrl, "canvas");
  };

  const handleUploadSave = async (file: File) => {
    setLoading(true);
    try {
      // API 라우트를 통해 이미지 업로드
      const formData = new FormData();
      formData.append("file", file);
      formData.append("signer_id", signerId);

      const uploadResponse = await fetch("/api/signatures/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "이미지 업로드에 실패했습니다.");
      }

      const uploadData = await uploadResponse.json();
      if (!uploadData || !uploadData.url) {
        throw new Error("업로드 응답을 받을 수 없습니다.");
      }

      // 업로드된 이미지 URL로 서명 저장
      await saveSignature(uploadData.url, "image");
    } catch (err: any) {
      alert(err.message || "서명 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const saveSignature = async (
    signatureData: string,
    signatureType: "canvas" | "image"
  ) => {
    setLoading(true);
    try {
      if (signatureId) {
        // 수정 모드: API 라우트를 통해 업데이트
        const response = await fetch(`/api/signatures/${signatureId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            signature_data: signatureData,
            signature_type: signatureType,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "서명 수정에 실패했습니다.");
        }

        // 응답 본문 확인
        const updatedData = await response.json();
        if (!updatedData || !updatedData.id) {
          throw new Error("서명 수정 응답을 받을 수 없습니다.");
        }
      } else {
        // 생성 모드: API 라우트를 통해 생성
        const response = await fetch("/api/signatures", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            evaluation_id: evaluationId,
            signer_id: signerId,
            signer_role: signerRole,
            signature_type: signatureType,
            signature_data: signatureData,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "서명 생성에 실패했습니다.");
        }

        // 응답 본문 확인
        const createdData = await response.json();
        if (!createdData || !createdData.id) {
          throw new Error("서명 생성 응답을 받을 수 없습니다.");
        }
      }

      onSuccess();
    } catch (err: any) {
      alert(err.message || "서명 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "select") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>서명 방법 선택</CardTitle>
          <CardDescription>서명 방식을 선택해주세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => setMode("canvas")}
            className="w-full"
            variant="outline"
          >
            손글씨 서명
          </Button>
          <Button
            onClick={() => setMode("upload")}
            className="w-full"
            variant="outline"
          >
            이미지 업로드
          </Button>
          <Button onClick={onCancel} variant="outline" className="w-full">
            취소
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "canvas" ? "손글씨 서명" : "이미지 업로드"}
        </CardTitle>
        <CardDescription>
          {mode === "canvas"
            ? "마우스나 터치로 서명해주세요"
            : "서명 이미지를 업로드해주세요"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">저장 중...</p>
          </div>
        ) : mode === "canvas" ? (
          <SignatureCanvasComponent
            onSave={handleCanvasSave}
            onCancel={() => setMode("select")}
          />
        ) : (
          <SignatureUpload
            onSave={handleUploadSave}
            onCancel={() => setMode("select")}
          />
        )}
      </CardContent>
    </Card>
  );
}
