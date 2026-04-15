"use client";

import { useQuery } from "@tanstack/react-query";
import adminApi from "@/lib/adminApi";
import { AdminTableViewLink } from "@/components/admin/AdminTableViewLink";

export default function AdminUsersPage() {
  const { data } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await adminApi.get("admin/users", { params: { limit: 200 } });
      return res.data.data as Record<string, unknown>[];
    },
  });

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="[font-family:'Montserrat',Helvetica] text-2xl font-bold text-[#111827]">Users</h1>
      <div className="overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white text-sm shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#f9fafb] text-[#6b7280]">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="w-14 p-3 text-center" aria-label="View details" />
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={String(u._id)} className="border-t border-[#f0f0f0]">
                <td className="p-3 font-medium text-[#111827]">{String(u.fullName || u.email)}</td>
                <td className="p-3 text-[#6b7280]">{String(u.email)}</td>
                <td className="p-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      u.role === "admin" ? "bg-red-50 text-red-700" : "bg-sky-50 text-sky-800"
                    }`}
                  >
                    {String(u.role)}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <AdminTableViewLink href={`/admin/users/${u._id}`} label="View user details" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
