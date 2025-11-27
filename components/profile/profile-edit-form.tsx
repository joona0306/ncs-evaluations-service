"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

import { Profile } from "@/types/common";

// Profile 타입은 types/common.ts에서 가져옴
// birth_date, gender는 Profile에 없으므로 확장
interface ExtendedProfile extends Profile {
  birth_date?: string | null;
  gender?: string | null;
}

interface ProfileEditFormProps {
  profile: ExtendedProfile;
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [birthDate, setBirthDate] = useState(
    profile.birth_date ? profile.birth_date.split("T")[0] : ""
  );
  const [gender, setGender] = useState(profile.gender || "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("/api/profiles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          phone: phone || null,
          birth_date: birthDate || null,
          gender: gender || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "프로필 수정에 실패했습니다.");
      }

      setSuccess(true);
      router.refresh();
      
      // 2초 후 성공 메시지 숨김
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error("프로필 수정 오류:", err);
      setError(err.message || "프로필 수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>프로필 정보</CardTitle>
        <CardDescription>
          개인 정보를 수정할 수 있습니다
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
              프로필이 성공적으로 수정되었습니다.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-muted-foreground">
              이메일은 변경할 수 없습니다
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">역할</Label>
            <Input
              id="role"
              type="text"
              value={
                profile.role === "admin"
                  ? "관리자"
                  : profile.role === "teacher"
                  ? "훈련교사"
                  : "훈련생"
              }
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-muted-foreground">
              역할은 변경할 수 없습니다
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">이름 *</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="홍길동"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">전화번호</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="010-1234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">생년월일</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">성별</Label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">선택하지 않음</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타</option>
            </select>
          </div>
        </CardContent>
        <div className="px-6 pb-6">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              "저장하기"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

