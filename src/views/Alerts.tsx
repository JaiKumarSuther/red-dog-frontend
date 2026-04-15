"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Shield, Clock, X } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { qk } from "@/lib/queryKeys";

type Alert = {
  id: string;
  org: string;
  priority: string;
  message: string;
  fitScore: number | null;
  grantName: string;
  time: string;
  read: boolean;
};

type ApiAlert = {
  _id: string;
  orgName?: string;
  organization?: { name?: string };
  priority?: string;
  message?: string;
  fitScore?: number;
  grantName?: string;
  opportunity?: { title?: string };
  isRead?: boolean;
  read?: boolean;
  createdAt?: string;
};

const mapAlert = (a: ApiAlert): Alert => ({
  id: a._id,
  org: a.orgName ?? a.organization?.name ?? "Unknown",
  priority: a.priority ?? "low",
  message: a.message ?? "",
  fitScore: a.fitScore ?? null,
  grantName: a.grantName ?? a.opportunity?.title ?? "",
  time: a.createdAt
    ? new Date(a.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })
    : "",
  read: a.read ?? a.isRead ?? false,
});

const priorityCfg = {
  high: { badgeCls: "bg-[#fee2e2] text-[#dc2626]", iconBg: "bg-[#fff1f0]", iconCls: "text-[#ef4444]", borderCls: "border-l-[#ef4444]", label: "High" },
  medium: { badgeCls: "bg-[#fef9c3] text-[#b45309]", iconBg: "bg-[#fefce8]", iconCls: "text-[#eab308]", borderCls: "border-l-[#f97316]", label: "Medium" },
  low: { badgeCls: "bg-[#f3f4f6] text-[#6b7280]", iconBg: "bg-[#f3f4f6]", iconCls: "text-[#9ca3af]", borderCls: "border-l-[#d1d5db]", label: "Low" },
};

const AlertCard = ({
  alert,
  onDismiss,
  onRead,
}: {
  alert: Alert;
  onDismiss: (id: string) => void;
  onRead: (id: string) => void;
}) => {
  const cfg = priorityCfg[alert.priority as keyof typeof priorityCfg] ?? priorityCfg.low;

  return (
    <div
      onClick={() => onRead(alert.id)}
      className={`relative flex items-start gap-4 px-5 py-4 border-l-4 ${cfg.borderCls} rounded-xl cursor-pointer transition-colors ${
        alert.read ? "bg-white border border-[#e5e7eb] border-l-4" : "bg-[#fffbfb] border border-[#f5e5e5] border-l-4"
      }`}
    >
      <div className={`w-10 h-10 rounded-full ${cfg.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Shield size={18} className={cfg.iconCls} />
      </div>

      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="[font-family:'Montserrat',Helvetica] text-sm font-bold break-words text-[#111827]">{alert.org}</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 [font-family:'Montserrat',Helvetica] text-xs font-semibold ${cfg.badgeCls}`}>
              {cfg.label}
            </span>
            {!alert.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[#ef3e34]" />}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(alert.id); }}
            data-testid={`button-dismiss-alert-${alert.id}`}
            className="flex h-6 w-6 shrink-0 items-center justify-center self-end rounded hover:bg-[#f3f4f6] transition-colors sm:self-auto"
          >
            <X size={13} className="text-[#9ca3af]" />
          </button>
        </div>

        <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#374151] text-sm leading-5">{alert.message}</p>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {alert.fitScore !== null && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-[#e5e7eb] bg-white [font-family:'Montserrat',Helvetica] font-medium text-[#374151] text-xs">
                Fit Score: {alert.fitScore}
              </span>
            )}
            {alert.grantName && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-[#e5e7eb] bg-white [font-family:'Montserrat',Helvetica] font-normal text-[#374151] text-xs">
                {alert.grantName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Clock size={11} className="text-[#9ca3af]" />
            <span className="[font-family:'Montserrat',Helvetica] font-normal text-[#9ca3af] text-xs">{alert.time}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Alerts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading: loading, isError, refetch } = useQuery<Alert[]>({
    queryKey: qk.alerts(),
    queryFn: async () => {
      const res = await api.get("/alerts", { params: { limit: 50 } });
      const raw: ApiAlert[] = res.data.data ?? [];
      return raw.map(mapAlert);
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/alerts/${id}`),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Alert[]>(qk.alerts(), (prev = []) =>
        prev.filter((a) => a.id !== id)
      );
      queryClient.invalidateQueries({ queryKey: qk.alertsUnread() });
    },
    onError: () => {
      toast({ title: "Failed to dismiss alert", variant: "destructive" });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.put(`/alerts/${id}/read`),
    onMutate: (id) => {
      queryClient.setQueryData<Alert[]>(qk.alerts(), (prev = []) =>
        prev.map((a) => a.id === id ? { ...a, read: true } : a)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.alertsUnread() });
    },
  });

  return (
    <div className="flex min-h-full min-w-0 flex-col gap-6 bg-neutral-50 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="[font-family:'Oswald',Helvetica] font-bold text-black text-2xl sm:text-3xl tracking-[0.5px] uppercase leading-tight">System Alerts</h1>
        <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#6b7280] text-sm">High-priority intelligence notifications requiring review</p>
      </div>

      <div className="bg-white rounded-xl border border-[#f0f0f0] shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-[#f3f4f6]">
          <Bell size={14} className="text-[#9ca3af]" />
          <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#9ca3af] text-xs tracking-[0.6px] uppercase">
            Active Alerts ({loading ? "..." : alerts.length})
          </span>
        </div>

        <div className="flex flex-col gap-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="[font-family:'Montserrat',Helvetica] font-normal text-[#9ca3af] text-sm">Loading alerts...</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#ef4444] text-sm">Failed to load alerts.</p>
              <button
                onClick={() => refetch()}
                className="[font-family:'Montserrat',Helvetica] text-xs font-medium text-[#6b7280] underline hover:text-[#374151]"
              >
                Try again
              </button>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-full bg-[#f3f4f6] flex items-center justify-center">
                <Bell size={20} className="text-[#d1d5db]" />
              </div>
              <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#9ca3af] text-sm">No active alerts</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="px-4 py-3 border-b border-[#f9fafb] last:border-b-0">
                <AlertCard
                  alert={alert}
                  onDismiss={(id) => dismissMutation.mutate(id)}
                  onRead={(id) => { if (!alert.read) markReadMutation.mutate(id); }}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
