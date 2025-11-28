"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { UserApprovalButton } from "@/components/users/user-approval-button";
import { UserCourseAssignment } from "@/components/users/user-course-assignment";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { User } from "@/types/common";

// User 타입은 types/common.ts에서 가져옴

interface UsersListProps {
  initialUsers: User[];
}

export function UsersList({ initialUsers }: UsersListProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [activeTab, setActiveTab] = useState<
    "pending" | "teachers" | "students"
  >("pending");

  const handleUpdate = async () => {
    try {
      const response = await fetch("/api/profiles");

      if (!response.ok) {
        console.error("사용자 목록 새로고침 오류");
        return;
      }

      const responseData = await response.json();
      // 페이징된 응답에서 data 필드 추출
      const usersData = Array.isArray(responseData)
        ? responseData
        : responseData.data || [];
      setUsers(usersData);
    } catch (error: any) {
      console.error("사용자 목록 새로고침 실패:", error);
    }
  };

  // users가 배열인지 확인
  const usersArray = Array.isArray(users) ? users : [];

  const pendingUsers = usersArray.filter(
    (u) => !u.approved && u.role !== "admin"
  );
  const approvedTeachers = usersArray.filter(
    (u) => (u.approved || u.role === "admin") && u.role === "teacher"
  );
  const approvedStudents = usersArray.filter(
    (u) => (u.approved || u.role === "admin") && u.role === "student"
  );

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "pending"
              ? "text-orange-600 border-b-2 border-orange-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          승인 대기 ({pendingUsers.length})
        </button>
        <button
          onClick={() => setActiveTab("teachers")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "teachers"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          훈련교사 ({approvedTeachers.length})
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "students"
              ? "text-green-600 border-b-2 border-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          훈련생 ({approvedStudents.length})
        </button>
      </div>

      {/* 승인 대기 탭 */}
      {activeTab === "pending" && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-orange-600">
            승인 대기 중인 사용자
          </h3>
          {pendingUsers.length > 0 ? (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium text-lg">
                          {user.full_name || "이름 없음"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              user.role === "teacher"
                                ? "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400"
                                : "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400"
                            }`}
                          >
                            {user.role === "teacher" ? "훈련교사" : "훈련생"}
                          </span>
                          {user.phone && (
                            <span className="text-sm text-muted-foreground">
                              {user.phone}
                            </span>
                          )}
                          <span className="px-2 py-1 text-xs rounded bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-400">
                            승인 대기
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            가입일:{" "}
                            {new Date(user.created_at).toLocaleDateString(
                              "ko-KR"
                            )}
                          </p>
                        </div>
                        <UserApprovalButton
                          userId={user.id}
                          approved={user.approved ?? false}
                          onUpdate={handleUpdate}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  승인 대기 중인 사용자가 없습니다.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 훈련교사 탭 */}
      {activeTab === "teachers" && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-blue-600">훈련교사</h3>
          {approvedTeachers.length > 0 ? (
            <div className="space-y-4">
              {approvedTeachers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-lg">
                            {user.full_name || "이름 없음"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400">
                              훈련교사
                            </span>
                            {user.phone && (
                              <span className="text-sm text-muted-foreground">
                                {user.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              가입일:{" "}
                              {new Date(user.created_at).toLocaleDateString(
                                "ko-KR"
                              )}
                            </p>
                          </div>
                          <UserApprovalButton
                            userId={user.id}
                            approved={user.approved ?? false}
                            onUpdate={handleUpdate}
                          />
                        </div>
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium mb-2">
                          배정된 훈련과정
                        </p>
                        <UserCourseAssignment
                          userId={user.id}
                          userRole="teacher"
                          onUpdate={handleUpdate}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  승인된 훈련교사가 없습니다.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 훈련생 탭 */}
      {activeTab === "students" && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-green-600">훈련생</h3>
          {approvedStudents.length > 0 ? (
            <div className="space-y-4">
              {approvedStudents.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-lg">
                            {user.full_name || "이름 없음"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span className="px-2 py-1 text-xs rounded bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400">
                              훈련생
                            </span>
                            {user.phone && (
                              <span className="text-sm text-muted-foreground">
                                {user.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              가입일:{" "}
                              {new Date(user.created_at).toLocaleDateString(
                                "ko-KR"
                              )}
                            </p>
                          </div>
                          <UserApprovalButton
                            userId={user.id}
                            approved={user.approved ?? false}
                            onUpdate={handleUpdate}
                          />
                        </div>
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium mb-2">
                          배정된 훈련과정
                        </p>
                        <UserCourseAssignment
                          userId={user.id}
                          userRole="student"
                          onUpdate={handleUpdate}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  승인된 훈련생이 없습니다.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
