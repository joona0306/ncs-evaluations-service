"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ScoreDistribution {
  over90: number;
  over80: number;
  over70: number;
  over60: number;
  under60: number;
  total: number;
}

interface StudentAchievement {
  student_id: string;
  student_name: string;
  student_email: string;
  evaluations_count: number;
  average_score: number;
}

interface AchievementChartsProps {
  scoreDistribution: ScoreDistribution;
  students: StudentAchievement[];
  competencyUnitAverage: number;
}

const COLORS = {
  over90: "#10b981", // green
  over80: "#3b82f6", // blue
  over70: "#f59e0b", // yellow
  over60: "#f97316", // orange
  under60: "#ef4444", // red
};

export function AchievementCharts({
  scoreDistribution,
  students,
  competencyUnitAverage,
}: AchievementChartsProps) {
  // 클라이언트 사이드에서만 렌더링 (SSR hydration 문제 방지)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 파이 차트 데이터
  const pieData = [
    {
      name: "90점 이상",
      value: scoreDistribution.over90,
      color: COLORS.over90,
      percentage:
        scoreDistribution.total > 0
          ? Math.round(
              (scoreDistribution.over90 / scoreDistribution.total) * 100
            )
          : 0,
    },
    {
      name: "80점 이상",
      value: scoreDistribution.over80,
      color: COLORS.over80,
      percentage:
        scoreDistribution.total > 0
          ? Math.round(
              (scoreDistribution.over80 / scoreDistribution.total) * 100
            )
          : 0,
    },
    {
      name: "70점 이상",
      value: scoreDistribution.over70,
      color: COLORS.over70,
      percentage:
        scoreDistribution.total > 0
          ? Math.round(
              (scoreDistribution.over70 / scoreDistribution.total) * 100
            )
          : 0,
    },
    {
      name: "60점 이상",
      value: scoreDistribution.over60,
      color: COLORS.over60,
      percentage:
        scoreDistribution.total > 0
          ? Math.round(
              (scoreDistribution.over60 / scoreDistribution.total) * 100
            )
          : 0,
    },
    {
      name: "60점 미만",
      value: scoreDistribution.under60,
      color: COLORS.under60,
      percentage:
        scoreDistribution.total > 0
          ? Math.round(
              (scoreDistribution.under60 / scoreDistribution.total) * 100
            )
          : 0,
    },
  ].filter((item) => item.value > 0);

  // 바 차트 데이터 (상위 15명만 표시)
  const barData = students
    .slice(0, 15)
    .map((student) => ({
      name:
        student.student_name.length > 8
          ? student.student_name.substring(0, 8) + "..."
          : student.student_name,
      fullName: student.student_name,
      score: student.average_score,
      email: student.student_email,
    }))
    .reverse(); // 낮은 점수부터 표시

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow-lg">
          <p className="font-semibold">
            {payload[0].payload.fullName || payload[0].name}
          </p>
          <p className="text-sm text-muted-foreground">
            {payload[0].payload.email}
          </p>
          <p className="text-sm font-medium">
            점수: <span className="text-primary">{payload[0].value}</span>점
          </p>
        </div>
      );
    }
    return null;
  };

  // 마운트 전에는 스켈레톤 표시
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="p-4 border rounded-lg bg-blue-50 dark:bg-gray-800/50">
          <p className="text-sm text-muted-foreground mb-1">능력단위평균</p>
          <p className="text-2xl font-bold text-foreground">
            {competencyUnitAverage.toFixed(2)}점
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-4">점수 분포</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div className="text-sm space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">90점 이상:</span>
                  <span className="font-medium">{scoreDistribution.over90}명</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">80점 이상:</span>
                  <span className="font-medium">{scoreDistribution.over80}명</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">70점 이상:</span>
                  <span className="font-medium">{scoreDistribution.over70}명</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">60점 이상:</span>
                  <span className="font-medium">{scoreDistribution.over60}명</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">60점 미만:</span>
                  <span className="font-medium">{scoreDistribution.under60}명</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t mt-2">
                  <span className="font-semibold">응시 인원:</span>
                  <span className="font-semibold">{scoreDistribution.total}명</span>
                </div>
              </div>
              <div className="h-48 w-full min-h-[192px] flex items-center justify-center">
                <div className="text-muted-foreground">로딩 중...</div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">
              훈련생별 점수 분포 ({students.length}명)
            </h4>
            <div className="h-[400px] w-full min-h-[400px] flex items-center justify-center">
              <div className="text-muted-foreground">로딩 중...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 능력단위평균 */}
      <div className="p-4 border rounded-lg bg-blue-50 dark:bg-gray-800/50">
        <p className="text-sm text-muted-foreground mb-1">능력단위평균</p>
        <p className="text-2xl font-bold text-foreground">
          {competencyUnitAverage.toFixed(2)}점
        </p>
      </div>

      {/* 점수 분포 파이 차트 */}
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-4">점수 분포</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">90점 이상:</span>
                <span className="font-medium">
                  {scoreDistribution.over90}명
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">80점 이상:</span>
                <span className="font-medium">
                  {scoreDistribution.over80}명
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">70점 이상:</span>
                <span className="font-medium">
                  {scoreDistribution.over70}명
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">60점 이상:</span>
                <span className="font-medium">
                  {scoreDistribution.over60}명
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">60점 미만:</span>
                <span className="font-medium">
                  {scoreDistribution.under60}명
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t mt-2">
                <span className="font-semibold">응시 인원:</span>
                <span className="font-semibold">
                  {scoreDistribution.total}명
                </span>
              </div>
            </div>
            <div className="h-48 w-full min-h-[192px] flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={192} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${percent ? Math.round(percent * 100) : 0}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  평가 데이터가 없습니다
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 훈련생별 점수 분포 바 차트 */}
        <div>
          <h4 className="font-semibold mb-4">
            훈련생별 점수 분포 ({students.length}명)
          </h4>
          {barData.length > 0 ? (
            <div className="h-[400px] w-full min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={400} minWidth={0}>
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]} 
                    tick={{ fontSize: 12 }}
                    tickCount={5}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, index) => {
                      const score = entry.score;
                      let color = COLORS.under60;
                      if (score >= 90) color = COLORS.over90;
                      else if (score >= 80) color = COLORS.over80;
                      else if (score >= 70) color = COLORS.over70;
                      else if (score >= 60) color = COLORS.over60;

                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              평가 데이터가 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
