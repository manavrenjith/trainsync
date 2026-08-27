import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

export default function AuditLogView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAudit() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/audit`);
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAudit();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-2">
        <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-[#64748B]">Loading audit trail...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs text-[#0F172A]">
      <div className="bg-white border border-[#E4E7EC] rounded-md p-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#0F172A]">
            Decision Audit & Override Log
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Immutable operational record of human manual decision overrides and system dispatches.
          </p>
        </div>
        <span className="px-3 py-1 bg-[#F7F8FA] border border-[#E4E7EC] text-[#2563EB] font-mono text-xs font-semibold rounded">
          {logs.length} Audited Records
        </span>
      </div>

      <div className="bg-white border border-[#E4E7EC] rounded-md overflow-x-auto">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#64748B]">
            Zero supervisor overrides recorded. Click 'Override' on any train row in the Daily Plan view to log a manual override.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-[#E4E7EC] text-[#64748B] font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Train ID</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Prev State</th>
                <th className="py-3 px-4">New State</th>
                <th className="py-3 px-4">Supervisor</th>
                <th className="py-3 px-4">Audited Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F7F8FA]/60 transition">
                  <td className="py-3 px-4 font-mono text-[#64748B]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-[#2563EB]">{log.train_id}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-[#F7F8FA] text-[#D97706] border border-[#E4E7EC]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#64748B]">{log.previous_decision || '-'}</td>
                  <td className="py-3 px-4 font-semibold text-[#16A34A]">{log.new_decision}</td>
                  <td className="py-3 px-4 font-medium text-[#0F172A]">{log.user_name}</td>
                  <td className="py-3 px-4 text-[#64748B] max-w-xs truncate">
                    {log.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
