"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EvaluationTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      href: "/dashboard/evaluations",
      label: "평가 관리",
      isActive: pathname === "/dashboard/evaluations",
    },
    {
      href: "/dashboard/evaluations/competency-units",
      label: "능력단위 관리",
      isActive: pathname === "/dashboard/evaluations/competency-units",
    },
    {
      href: "/dashboard/evaluations/schedules",
      label: "평가일정 관리",
      isActive: pathname === "/dashboard/evaluations/schedules",
    },
    {
      href: "/dashboard/evaluations/new",
      label: "새 평가 작성",
      isActive: pathname === "/dashboard/evaluations/new",
    },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map((tab) => (
        <Link key={tab.href} href={tab.href}>
          <Button
            variant={tab.isActive ? "default" : "outline"}
            className={cn(
              "transition-colors",
              tab.isActive && "bg-primary text-primary-foreground"
            )}
          >
            {tab.label}
          </Button>
        </Link>
      ))}
    </div>
  );
}
