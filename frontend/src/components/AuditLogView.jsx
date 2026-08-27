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
        <div className="w-8 h-8 border-2 border-[#5B8FB0] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-[#9E9E96]">Loading operational audit trail...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="depot-panel p-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold text-[#E8E6DF] uppercase tracking-wider">
            Decision Audit & Supervisor Override Log
          </h2>
          <p className="text-xs text-[#9E9E96] font-mono mt-0.5">
            Immutable operational record of human manual decision overrides and system dispatches
          </p>
        </div>
        <span className="px-3 py-1 bg-[#0C1116] border border-[#28323E] text-[#5B8FB0] font-mono text-xs rounded">
          {logs.length} AUDITED RECORDS
        </span>
      </div>

      <div className="depot-panel overflow-x-auto">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-[#9E9E96]">
            Zero supervisor overrides recorded. Click 'Override' on any train row in the Daily Plan view to log a manual override.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-[#0C1116] border-b border-[#28323E] text-[#9E9E96] uppercase">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Train ID</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Prev State</th>
                <th className="py-3 px-4">New State</th>
                <th className="py-3 px-4">Supervisor</th>
                <th className="py-3 px-4">Audited Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#28323E]/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#1C242D]/40 transition">
                  <td className="py-3 px-4 text-[#9E9E96]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#5B8FB0]">{log.train_id}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#221B10] text-[#E0A526] border border-[#E0A526]/40">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#9E9E96]">{log.previous_decision || '-'}</td>
                  <td className="py-3 px-4 font-bold text-[#3FA34D]">{log.new_decision}</td>
                  <td className="py-3 px-4 text-[#E8E6DF]">{log.user_name}</td>
                  <td className="py-3 px-4 text-[#E8E6DF] font-sans max-w-xs truncate">
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
