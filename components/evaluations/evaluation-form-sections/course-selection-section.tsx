"use client";

import { Label } from "@/components/ui/label";

interface CourseSelectionSectionProps {
  courses: any[];
  selectedCourse: string;
  onCourseChange: (courseId: string) => void;
  competencyUnits: any[];
  selectedUnit: string;
  onUnitChange: (unitId: string) => void;
  students: any[];
  selectedStudent: string;
  onStudentChange: (studentId: string) => void;
  disabled?: boolean;
}

export function CourseSelectionSection({
  courses,
  selectedCourse,
  onCourseChange,
  competencyUnits,
  selectedUnit,
  onUnitChange,
  students,
  selectedStudent,
  onStudentChange,
  disabled = false,
}: CourseSelectionSectionProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="course">훈련과정 *</Label>
        <select
          id="course"
          value={selectedCourse}
          onChange={(e) => {
            onCourseChange(e.target.value);
            onUnitChange("");
            onStudentChange("");
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          required
          disabled={disabled}
          aria-required="true"
          aria-describedby="course-description"
        >
          <option value="">선택하세요</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name} ({course.code})
            </option>
          ))}
        </select>
        <span id="course-description" className="sr-only">
          평가할 훈련과정을 선택하세요
        </span>
      </div>

      {selectedCourse && (
        <>
          <div className="space-y-2">
            <Label htmlFor="unit">능력단위 *</Label>
            <select
              id="unit"
              value={selectedUnit}
              onChange={(e) => onUnitChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              disabled={disabled}
              aria-required="true"
              aria-describedby="unit-description"
            >
              <option value="">선택하세요</option>
              {competencyUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.code})
                </option>
              ))}
            </select>
            <span id="unit-description" className="sr-only">
              평가할 능력단위를 선택하세요
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="student">학생 *</Label>
            <select
              id="student"
              value={selectedStudent}
              onChange={(e) => onStudentChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              disabled={disabled}
              aria-required="true"
              aria-describedby="student-description"
            >
              <option value="">선택하세요</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name || student.email}
                </option>
              ))}
            </select>
            <span id="student-description" className="sr-only">
              평가할 학생을 선택하세요
            </span>
          </div>
        </>
      )}
    </>
  );
}

