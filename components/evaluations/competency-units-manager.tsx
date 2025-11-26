"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CompetencyUnits } from "@/components/courses/competency-units";

interface CompetencyUnitsManagerProps {
  courses: any[];
}

export function CompetencyUnitsManager({ courses }: CompetencyUnitsManagerProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            배정된 훈련과정이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>훈련과정 선택</CardTitle>
          <CardDescription>
            능력단위를 관리할 훈련과정을 선택하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="course">훈련과정</Label>
            <Select
              id="course"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedCourseId && (
        <CompetencyUnits courseId={selectedCourseId} />
      )}
    </div>
  );
}

