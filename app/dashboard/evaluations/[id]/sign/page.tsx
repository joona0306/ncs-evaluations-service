"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { SignatureModal } from "@/components/signatures/signature-modal";
import { useAuthStore } from "@/stores/auth-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignEvaluationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();
  const {
    user: storeUser,
    profile,
    isInitialized,
    initialize,
  } = useAuthStore();
  const [evaluation, setEvaluation] = useState<any>(null);
  const [user, setUser] = useState<any>(storeUser);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSignature, setEditingSignature] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store 초기화 확인
  useEffect(() => {
    if (!isInitialized) {
      initialize().catch((err) => {
        setError("인증 정보를 불러오는 데 실패했습니다.");
        setLoading(false);
      });
    }
  }, [isInitialized, initialize]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 병렬로 모든 데이터 로드 (타임아웃 30초로 증가)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const [userResponse, evalResponse, sigResponse] = await Promise.all([
          fetch("/api/auth/me", { signal: controller.signal }),
          fetch(`/api/evaluations/${id}`, { signal: controller.signal }),
          fetch(`/api/signatures?evaluation_id=${id}&t=${Date.now()}`, {
            signal: controller.signal,
            cache: "no-store",
          }),
        ]);

        clearTimeout(timeoutId);

        // 사용자 정보 처리
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.user) {
            setUser(userData.user);
          } else {
            setError("로그인이 필요합니다.");
            setLoading(false);
            return;
          }
        } else {
          setError("로그인이 필요합니다.");
          setLoading(false);
          return;
        }

        // 평가 데이터 처리
        if (evalResponse.ok) {
          const evalData = await evalResponse.json();
          setEvaluation(evalData);
          setError(null);
        } else {
          const errorData = await evalResponse.json().catch(() => ({}));
          setError(errorData.error || "평가 데이터를 불러올 수 없습니다.");
          setLoading(false);
          return;
        }

        // 서명 데이터 처리
        if (sigResponse.ok) {
          const sigData = await sigResponse.json();
          // 정렬하여 최신 서명이 먼저 오도록
          const sortedSignatures = Array.isArray(sigData)
            ? [...sigData].sort((a, b) => 
                new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime()
              )
            : [];
          
          // 이미지 URL 처리 (Storage URL인 경우 서명된 URL로 변환)
          const processedSignatures = await Promise.all(
            sortedSignatures.map(async (sig: any) => {
              if (sig.signature_type === "image" && sig.signature_data) {
                // HTTP URL인 경우 (Storage URL일 수 있음)
                if (sig.signature_data.startsWith("http")) {
                  let urlToProcess = sig.signature_data;
                  
                  // 중복된 signatures/ 경로가 있는지 확인 및 수정
                  if (urlToProcess.includes("/signatures/signatures/")) {
                    urlToProcess = urlToProcess.replace(
                      "/signatures/signatures/",
                      "/signatures/"
                    );
                  }
                  
                  // 서명된 URL로 변환 시도
                  try {
                    const urlResponse = await fetch(
                      `/api/signatures/image-url?url=${encodeURIComponent(urlToProcess)}`
                    );
                    if (urlResponse.ok) {
                      const urlData = await urlResponse.json();
                      if (urlData.url && urlData.url !== urlToProcess) {
                        // 서명된 URL로 성공적으로 변환됨
                        return { ...sig, signature_data: urlData.url };
                      }
                    }
                  } catch (err) {
                    console.error("이미지 URL 변환 실패:", err);
                  }
                  
                  // 변환 실패 시 수정된 URL 사용 (원본이 아닌)
                  if (urlToProcess !== sig.signature_data) {
                    return { ...sig, signature_data: urlToProcess };
                  }
                }
                // base64 데이터 URL인 경우 그대로 사용
              }
              return sig;
            })
          );
          
          setSignatures(processedSignatures);
        } else {
          setSignatures([]);
        }

        setLoading(false);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          setError("요청 시간이 초과되었습니다. 다시 시도해주세요.");
        } else {
          setError("데이터를 불러오는 중 오류가 발생했습니다.");
        }
        setLoading(false);
      }
    } catch (error: any) {
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("평가 ID가 없습니다.");
      return;
    }

    // Store 초기화를 기다리지 않고 바로 데이터 로드 (API를 통해 사용자 정보 확인)
    loadData();
  }, [id, loadData]);

  const handleSuccess = async () => {
    setShowModal(false);
    setEditingSignature(null);
    
    // 상태 초기화 후 전체 데이터 리로드
    setSignatures([]);
    
    // 약간의 지연 후 데이터 리로드 (DB 업데이트 완료 대기)
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    // 전체 데이터 리로드로 확실하게 업데이트
    await loadData();
  };

  const handleDeleteSignature = async (signatureId: string) => {
    if (!confirm("정말로 이 서명을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/signatures/${signatureId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // 상태 초기화 후 데이터 리로드
        setSignatures([]);
        await new Promise((resolve) => setTimeout(resolve, 200));
        await loadData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "서명 삭제에 실패했습니다.");
      }
    } catch (err: any) {
      console.error("서명 삭제 오류:", err);
      alert(err.message || "서명 삭제에 실패했습니다.");
    }
  };

  const getSignerRole = (): "teacher" | "student" | "admin" => {
    if (!evaluation || !user) return "student";
    if (evaluation.teacher_id === user.id) return "teacher";
    if (evaluation.student_id === user.id) return "student";
    return "student";
  };

  const hasSigned = () => {
    if (!user) return false;
    return signatures.some((sig) => sig.signer_id === user.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">
              {error || "평가를 찾을 수 없습니다."}
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/dashboard/evaluations">
                <Button variant="outline">목록으로</Button>
              </Link>
              <Button variant="outline" onClick={() => loadData()}>
                다시 시도
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <BackButton href={`/dashboard/evaluations/${id}`} />
      <Card>
        <CardHeader>
          <CardTitle>평가 서명</CardTitle>
          <CardDescription>평가에 서명하여 확인합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {showModal || editingSignature ? (
            <SignatureModal
              evaluationId={id}
              signerId={user.id}
              signerRole={getSignerRole()}
              signatureId={editingSignature?.id}
              onSuccess={handleSuccess}
              onCancel={() => {
                setShowModal(false);
                setEditingSignature(null);
              }}
            />
          ) : hasSigned() ? (
            <div className="text-center py-8">
              <p className="text-green-600 font-medium mb-4">
                이미 서명하셨습니다.
              </p>
              <div className="space-y-2">
                {signatures
                  .filter((sig) => sig.signer_id === user.id)
                  .map((sig) => (
                    <div key={`sig-div-${sig.id}-${sig.signed_at}-${sig.updated_at}`} className="p-4 border rounded space-y-3">
                      <p className="text-sm text-muted-foreground">
                        서명일:{" "}
                        {new Date(sig.signed_at).toLocaleString("ko-KR")}
                      </p>
                      <img
                        key={`sig-${sig.id}-${sig.signed_at}-${sig.updated_at || sig.signed_at}`}
                        src={sig.signature_data}
                        alt="서명"
                        className="max-w-full h-auto max-h-32 mx-auto border rounded bg-white p-2"
                      />
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingSignature(sig);
                            setShowModal(true);
                          }}
                        >
                          수정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSignature(sig.id)}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  평가 내용을 확인하신 후 서명해주세요.
                </p>
              </div>
              <div className="space-y-4">
                <Button onClick={() => setShowModal(true)} className="w-full">
                  서명하기
                </Button>
                <Link href={`/dashboard/evaluations/${id}`}>
                  <Button variant="outline" className="w-full">
                    취소
                  </Button>
                </Link>
              </div>
            </>
          )}

          {signatures.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">서명 이력</h3>
              <div className="space-y-4">
                {signatures.map((sig) => {
                  const isOwnSignature = sig.signer_id === user.id;
                  const canManage = isOwnSignature || profile?.role === "admin";

                  return (
                    <div key={`sig-history-${sig.id}-${sig.signed_at}-${sig.updated_at}`} className="p-4 border rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">
                            {sig.signer_role === "teacher"
                              ? "교사"
                              : sig.signer_role === "student"
                              ? "학생"
                              : "관리자"}
                            {sig.signer?.full_name &&
                              ` - ${sig.signer.full_name}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(sig.signed_at).toLocaleString("ko-KR")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            {sig.signature_type === "canvas"
                              ? "손글씨"
                              : "이미지"}
                          </span>
                          {canManage && (
                            <div className="flex gap-1">
                              {isOwnSignature && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingSignature(sig);
                                    setShowModal(true);
                                  }}
                                  className="h-7 px-2 text-xs"
                                >
                                  수정
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSignature(sig.id)}
                                className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                              >
                                삭제
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    <img
                      key={`sig-${sig.id}-${sig.signed_at}-${sig.updated_at || sig.signed_at}`}
                      src={sig.signature_data}
                      alt="서명"
                      className="max-w-full h-auto max-h-32 mt-2 border rounded"
                    />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
