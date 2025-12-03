"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CompetencyUnitsViewProps {
  courseId: string;
  competencyUnits: any[];
}

export function CompetencyUnitsView({
  courseId,
  competencyUnits,
}: CompetencyUnitsViewProps) {
  if (competencyUnits.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        등록된 능력단위가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {competencyUnits.map((unit) => (
        <Card key={unit.id} className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-lg">{unit.name}</CardTitle>
            <CardDescription>
              {unit.code}
              {unit.description && (
                <span className="ml-2 text-xs">
                  - {unit.description.substring(0, 100)}
                  {unit.description.length > 100 ? "..." : ""}
                </span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

