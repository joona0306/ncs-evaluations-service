"use client";

interface ScoreSummarySectionProps {
  rawTotal: number;
  maxTotal: number;
  convertedScore: number;
}

export function ScoreSummarySection({
  rawTotal,
  maxTotal,
  convertedScore,
}: ScoreSummarySectionProps) {
  return (
    <div className="border rounded-lg p-4 bg-blue-50">
      <h4 className="font-semibold mb-2">점수 요약</h4>
      <div className="space-y-1 text-sm">
        <p>
          원점수: {rawTotal} / {maxTotal}점
        </p>
        <p className="text-lg font-bold text-blue-700">
          환산 점수: {convertedScore} / 100점
        </p>
      </div>
    </div>
  );
}

