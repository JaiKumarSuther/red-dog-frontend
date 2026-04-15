"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RefreshCw, AlertTriangle, TrendingUp, FileText, CheckCircle, Trophy, DollarSign, Target } from "lucide-react";
import api from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useAuth } from "@/lib/AuthContext";

type TrackerStats = {
  totalMatchedFunders: number;
  applicationsInProgress: number;
  submittedApplications: number;
  awardsWon: number;
  totalDollarsRequested: number;
  totalDollarsAwarded: number;
  statusCounts: Record<string, number>;
};

type AttentionItem = {
  type: string;
  priority: string;
  orgName: string;
  grantName: string;
  description: string;
  date: string | null;
};

type DashboardData = {
  attentionItems: AttentionItem[];
};

const fmtDollars = (n: number) => {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(0) + "K";
  return "$" + n.toLocaleString();
};

const SkeletonBox = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-[#f3f4f6] rounded ${className ?? ""}`} />
);

const priorityStyle = (priority: string) => {
  const p = priority.toUpperCase();
  if (p === "HIGH") return { bg: "bg-[#ef3e341a]", border: "border-[#ef3e3433]", text: "text-[#ff6366]" };
  if (p === "MEDIUM") return { bg: "bg-[#fd99001a]", border: "border-[#fd990033]", text: "text-[#ffb900]" };
  return { bg: "bg-[#f3f4f6]", border: "border-[#e5e7eb]", text: "text-[#6b7280]" };
};

const statCards = [
  {
    key: "totalMatchedFunders" as keyof TrackerStats,
    label: "Matched Funders",
    icon: Target,
    color: "text-[#50a2ff]",
    bg: "bg-[#eef5fe]",
    path: "/funders",
    format: (v: number) => String(v),
  },
  {
    key: "applicationsInProgress" as keyof TrackerStats,
    label: "In Progress",
    icon: FileText,
    color: "text-[#c17aff]",
    bg: "bg-[#f5f0ff]",
    path: "/applications",
    format: (v: number) => String(v),
  },
  {
    key: "submittedApplications" as keyof TrackerStats,
    label: "Submitted",
    icon: CheckCircle,
    color: "text-[#00d491]",
    bg: "bg-[#e6fdf5]",
    path: "/tracker",
    format: (v: number) => String(v),
  },
  {
    key: "awardsWon" as keyof TrackerStats,
    label: "Awards Won",
    icon: Trophy,
    color: "text-[#feb900]",
    bg: "bg-[#fff9e6]",
    path: "/wins",
    format: (v: number) => String(v),
  },
  {
    key: "totalDollarsRequested" as keyof TrackerStats,
    label: "$ Requested",
    icon: TrendingUp,
    color: "text-[#ef3e34]",
    bg: "bg-[#fff1f0]",
    path: "/tracker",
    format: fmtDollars,
  },
  {
    key: "totalDollarsAwarded" as keyof TrackerStats,
    label: "$ Awarded",
    icon: DollarSign,
    color: "text-[#00d491]",
    bg: "bg-[#e6fdf5]",
    path: "/wins",
    format: fmtDollars,
  },
];

export const PlatformDashboardSection = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: trackerStats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery<TrackerStats>({
    queryKey: qk.trackerStats(),
    queryFn: async () => {
      const res = await api.get("/tracker/stats");
      return res.data.data as TrackerStats;
    },
  });

  const { data: dashData, isLoading: dashLoading } = useQuery<DashboardData>({
    queryKey: qk.dashboard(),
    queryFn: async () => {
      const res = await api.get("/dashboard/stats");
      return res.data.data as DashboardData;
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: qk.trackerStats() }),
      queryClient.invalidateQueries({ queryKey: qk.dashboard() }),
    ]);
    await refetchStats();
    setTimeout(() => setRefreshing(false), 600);
  };

  const loading = statsLoading || dashLoading;
  const attentionItems = dashData?.attentionItems ?? [];

  const firstName = user?.firstName || user?.fullName?.split(" ")[0] || "there";

  return (
    <div className="flex w-full flex-1 flex-col items-start overflow-y-auto px-4 pb-0 pt-6 sm:px-6 sm:pt-8 lg:px-8">
      <div className="flex w-full flex-1 flex-col items-start gap-6 self-stretch sm:gap-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between self-stretch w-full gap-4">
          <div className="flex min-w-0 flex-col items-start gap-1">
            <h1 className="[font-family:'Oswald',Helvetica] font-bold text-black text-xl min-[400px]:text-2xl sm:text-3xl tracking-[-0.75px] leading-tight sm:leading-9 break-words">
              WELCOME BACK, {firstName.toUpperCase()}
            </h1>
            <p className="[font-family:'Montserrat',Helvetica] font-normal text-black text-sm tracking-[0] leading-5 max-w-prose break-words">
              Your grant intelligence snapshot — funders matched, applications in motion, and dollars on the table.
            </p>
          </div>

          <div className="flex w-full flex-wrap items-stretch gap-2 sm:w-auto sm:items-center sm:gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/weekly-summary")}
              className="h-10 min-h-10 flex-1 gap-2 px-3 sm:flex-initial sm:px-4 py-2 bg-white border border-solid border-[#ef3e34] text-[#ef3e34] hover:bg-[#ef3e341a] [font-family:'Montserrat',Helvetica] font-medium text-sm"
            >
              <img className="w-4 h-4" alt="Weekly" src="/figmaAssets/svg-3.svg" />
              <span className="hidden sm:inline [font-family:'Montserrat',Helvetica] font-medium text-[#ef3e34] text-sm leading-5 whitespace-nowrap">
                Weekly Summary
              </span>
              <span className="sm:hidden [font-family:'Montserrat',Helvetica] font-medium text-[#ef3e34] text-sm">
                Summary
              </span>
            </Button>

            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-10 min-h-10 flex-1 gap-2 px-3 sm:flex-initial sm:px-4 py-2 bg-[#ef3e34] hover:bg-[#d63530] rounded-md [font-family:'Montserrat',Helvetica] font-bold text-white text-sm"
            >
              <RefreshCw size={16} className={`${refreshing ? "animate-spin" : ""}`} />
              <span className="[font-family:'Montserrat',Helvetica] font-bold text-white text-sm leading-5 whitespace-nowrap">
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </Button>
          </div>
        </div>

        {/* Error Banner */}
        {statsError && (
          <div className="flex w-full items-center gap-3 rounded-xl border border-[#fecaca] bg-[#fff1f0] px-4 py-3">
            <AlertTriangle size={16} className="shrink-0 text-[#dc2626]" />
            <span className="min-w-0 flex-1 [font-family:'Montserrat',Helvetica] text-sm font-normal text-[#dc2626]">
              Failed to load stats.
            </span>
            <button
              onClick={() => void handleRefresh()}
              className="shrink-0 [font-family:'Montserrat',Helvetica] text-sm font-semibold text-[#dc2626] hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 self-stretch w-full">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            const value = trackerStats?.[card.key] ?? 0;
            return (
              <Card
                key={index}
                onClick={() => !loading && router.push(card.path)}
                className="flex min-w-0 items-center gap-3 p-4 bg-white rounded-xl border border-solid border-[#0000001a] shadow-none cursor-pointer hover:shadow-md hover:border-[#ef3e3433] transition-all"
              >
                <CardContent className="flex min-w-0 flex-1 items-center gap-3 p-0 w-full">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${card.bg} shrink-0`}>
                    <Icon size={20} className={card.color} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                    <span className="[font-family:'Montserrat',Helvetica] font-medium text-black text-xs sm:text-sm tracking-[0] leading-snug break-words">
                      {card.label}
                    </span>
                    {loading ? (
                      <SkeletonBox className="h-8 w-12 mt-1" />
                    ) : (
                      <span className={`[font-family:'Oswald',Helvetica] font-bold ${card.color} text-2xl sm:text-3xl tracking-[-0.75px] leading-tight tabular-nums`}>
                        {card.format(value as number)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 self-stretch w-full">
          {[
            { label: "Browse Funders", path: "/funders", color: "border-[#50a2ff] text-[#50a2ff] hover:bg-[#eef5fe]" },
            { label: "New Application", path: "/opportunities", color: "border-[#ef3e34] text-[#ef3e34] hover:bg-[#fff1f0]" },
            { label: "View Tracker", path: "/tracker", color: "border-[#00d491] text-[#00d491] hover:bg-[#e6fdf5]" },
            { label: "Wins Database", path: "/wins", color: "border-[#feb900] text-[#feb900] hover:bg-[#fff9e6]" },
          ].map((action) => (
            <button
              key={action.path}
              onClick={() => router.push(action.path)}
              className={`rounded-xl border bg-white px-4 py-3 text-sm font-semibold [font-family:'Montserrat',Helvetica] transition-colors ${action.color}`}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 self-stretch w-full pb-8">
          {/* Needs Attention */}
          <Card className="lg:col-span-2 flex flex-col items-start rounded-xl overflow-hidden border border-solid border-[#0000001a] shadow-none bg-white">
            <CardHeader className="flex flex-row items-center p-4 sm:p-6 self-stretch w-full bg-white border-b border-[#0000000d] space-y-0">
              <div className="inline-flex min-w-0 items-center gap-2">
                <img className="w-5 h-5 flex-shrink-0" alt="Needs Attention" src="/figmaAssets/svg-13.svg" />
                <span className="[font-family:'Oswald',Helvetica] font-semibold text-black text-base sm:text-lg tracking-[-0.45px] leading-snug sm:leading-7 break-words">
                  NEEDS ATTENTION
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-start self-stretch w-full p-0 bg-white">
              {loading ? (
                <div className="flex flex-col gap-0 w-full">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 p-4 sm:p-5 border-b border-[#0000000d]">
                      <div className="flex flex-col gap-2 w-full">
                        <SkeletonBox className="h-4 w-24" />
                        <SkeletonBox className="h-4 w-full" />
                        <SkeletonBox className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : attentionItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 w-full">
                  <CheckCircle size={24} className="text-[#00d491]" />
                  <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#111827] text-sm">All caught up!</p>
                  <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#9ca3af] text-xs">No urgent items need your attention.</p>
                </div>
              ) : (
                attentionItems.map((item, index) => {
                  const ps = priorityStyle(item.priority);
                  return (
                    <div key={index} className="flex items-start justify-between gap-3 p-4 sm:p-5 self-stretch w-full border-b border-[#0000000d]">
                      <div className="flex min-w-0 flex-col items-start gap-1">
                        <div className="flex flex-col items-start gap-2 self-stretch w-full sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 ${ps.bg} rounded-full border border-solid ${ps.border} flex-shrink-0`}>
                            <span className={`[font-family:'Montserrat',Helvetica] font-semibold ${ps.text} text-xs tracking-[0] leading-4 whitespace-nowrap`}>
                              {item.priority.toUpperCase()}
                            </span>
                          </span>
                          <span className="min-w-0 [font-family:'Montserrat',Helvetica] font-semibold text-black text-sm sm:text-base tracking-[0] leading-snug sm:leading-6 break-words">
                            {item.grantName}
                          </span>
                        </div>
                        <span className="[font-family:'Montserrat',Helvetica] font-normal text-[#666666] text-xs sm:text-sm tracking-[0] leading-5">
                          {item.description}
                        </span>
                        {item.date && (
                          <div className="flex items-center gap-1.5 pt-[3.5px]">
                            <img className="w-3 h-3" alt="Due date" src="/figmaAssets/svg.svg" />
                            <span className="[font-family:'Montserrat',Helvetica] font-normal text-[#a5a5a5] text-xs tracking-[0] leading-4 whitespace-nowrap">
                              {item.date}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Application Status Breakdown */}
          <Card className="lg:col-span-1 flex flex-col items-start rounded-xl overflow-hidden border border-solid border-[#0000001a] shadow-none bg-white lg:self-start">
            <CardHeader className="flex flex-row items-center p-4 sm:p-6 self-stretch w-full bg-white border-b border-[#0000000d] space-y-0">
              <div className="flex min-w-0 items-center gap-2 self-stretch w-full">
                <img className="w-5 h-5 flex-shrink-0" alt="Applications" src="/figmaAssets/svg-2.svg" />
                <span className="[font-family:'Oswald',Helvetica] font-semibold text-black text-base sm:text-lg tracking-[-0.45px] leading-snug sm:leading-7 break-words">
                  APPLICATION STATUS
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-3 p-4 sm:p-5 self-stretch w-full bg-white">
              {loading ? (
                <div className="flex flex-col gap-3 w-full">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between w-full">
                      <SkeletonBox className="h-3 w-24" />
                      <SkeletonBox className="h-3 w-8" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {[
                    { label: "Draft", key: "draft", color: "bg-gray-400" },
                    { label: "Ready to Submit", key: "ready_to_submit", color: "bg-purple-500" },
                    { label: "Submitted", key: "submitted", color: "bg-orange-400" },
                    { label: "In Review", key: "in_review", color: "bg-yellow-400" },
                    { label: "Awarded", key: "awarded", color: "bg-green-500" },
                    { label: "Denied", key: "denied", color: "bg-red-400" },
                  ].map(({ label, key, color }) => {
                    const count = trackerStats?.statusCounts?.[key] ?? 0;
                    if (count === 0) return null;
                    return (
                      <div key={key} className="flex items-center justify-between self-stretch w-full">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
                          <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151]">{label}</span>
                        </div>
                        <span className="[font-family:'Oswald',Helvetica] font-bold text-[#111827] text-base">{count}</span>
                      </div>
                    );
                  })}
                  {Object.values(trackerStats?.statusCounts ?? {}).every((v) => v === 0) && (
                    <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#9ca3af]">No applications yet</p>
                  )}
                  <button
                    onClick={() => router.push("/applications")}
                    className="mt-2 w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-4 py-2 text-sm font-semibold text-[#374151] [font-family:'Montserrat',Helvetica] hover:bg-[#f3f4f6] transition-colors"
                  >
                    View All Applications
                  </button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
