import React, { useState } from 'react';
import StablingDiagram from './StablingDiagram';

export default function DailyPlanView({
  plan,
  loading,
  onSelectTrainForTrace,
  onSelectTrainForOverride,
  onSelectTrainDetail,
  onOpenShuntPlan
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDecision, setFilterDecision] = useState('ALL');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-2">
        <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-[#64748B]">Loading fleet evaluation data...</p>
      </div>
    );
  }

  // Counts
  const totalCount = plan.length;
  const inductCount = plan.filter(d => d.decision === 'INDUCT').length;
  const standbyCount = plan.filter(d => d.decision === 'STANDBY').length;
  const iblCount = plan.filter(d => d.decision === 'IBL').length;
  const hardViolationsCount = plan.filter(d => !d.is_eligible).length;

  const filteredPlan = plan.filter(item => {
    const matchesSearch = item.train_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterDecision === 'ALL' || item.decision === filterDecision || (filterDecision === 'VIOLATIONS' && !item.is_eligible);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Horizontal Operational Telemetry Strip */}
      <div className="bg-[#F7F8FA] border border-[#E4E7EC] rounded-md px-5 py-3 flex flex-wrap items-center justify-between text-xs text-[#0F172A]">
        <div className="flex items-center space-x-6">
          <div>
            <span className="text-[#64748B]">Total Fleet:</span>{' '}
            <span className="font-semibold font-mono">{totalCount}</span>
          </div>

          <div className="h-3 w-px bg-[#E4E7EC]"></div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
            <span className="text-[#64748B]">Induct:</span>{' '}
            <span className="font-semibold font-mono">{inductCount}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
            <span className="text-[#64748B]">Standby:</span>{' '}
            <span className="font-semibold font-mono">{standbyCount}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
            <span className="text-[#64748B]">IBL Maintenance:</span>{' '}
            <span className="font-semibold font-mono">{iblCount}</span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-[#DC2626] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
          <span>Hard Failures: {hardViolationsCount}</span>
        </div>
      </div>

      {/* Signature Element: Stabling Yard Layout Diagram */}
      <StablingDiagram plan={plan} onSelectTrain={onSelectTrainDetail} />

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-[#E4E7EC] rounded-md p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Search train ID (e.g. KMRL-004)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F7F8FA] border border-[#E4E7EC] rounded px-3 py-1.5 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 text-xs overflow-x-auto">
          {[
            { id: 'ALL', label: `All (${totalCount})` },
            { id: 'INDUCT', label: `Induct (${inductCount})` },
            { id: 'STANDBY', label: `Standby (${standbyCount})` },
            { id: 'IBL', label: `IBL (${iblCount})` },
            { id: 'VIOLATIONS', label: `Hard Fails (${hardViolationsCount})` }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilterDecision(btn.id)}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                filterDecision === btn.id
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#F7F8FA] text-[#64748B] hover:text-[#0F172A] border border-[#E4E7EC]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Manifest Table */}
      <div className="bg-white border border-[#E4E7EC] rounded-md overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F7F8FA] border-b border-[#E4E7EC] text-[#64748B] font-semibold">
              <th className="py-3.5 px-4">Train ID</th>
              <th className="py-3.5 px-4">Decision</th>
              <th className="py-3.5 px-4">Hard Compliance</th>
              <th className="py-3.5 px-4">Score</th>
              <th className="py-3.5 px-4">Reason Trace</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E7EC]">
            {filteredPlan.map((item) => {
              const isInduct = item.decision === 'INDUCT';
              const isStandby = item.decision === 'STANDBY';
              const isOverridden = !!item.override_of;

              const dotColor = isInduct ? 'bg-[#16A34A]' : isStandby ? 'bg-[#D97706]' : 'bg-[#DC2626]';
              const blockageViolation = item.hard_violations && item.hard_violations.find(v => v.toLowerCase().includes('blocked'));

              return (
                <tr key={item.train_id} className="hover:bg-[#F7F8FA]/60 transition">
                  {/* Train ID with small dot */}
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#0F172A]">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}></span>
                      <button
                        onClick={() => onSelectTrainDetail(item.train_id)}
                        className="hover:text-[#2563EB] hover:underline"
                      >
                        {item.train_id}
                      </button>
                      {isOverridden && (
                        <span className="text-[10px] text-[#D97706] font-normal font-sans">(Overridden)</span>
                      )}
                    </div>
                  </td>

                  {/* Decision */}
                  <td className="py-3.5 px-4 text-[#0F172A] font-medium">
                    {isInduct ? 'Induct' : isStandby ? 'Standby' : 'IBL'}
                  </td>

                  {/* Hard Compliance */}
                  <td className="py-3.5 px-4">
                    {item.is_eligible ? (
                      <span className="text-[#64748B] font-medium">Eligible</span>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-[#DC2626] font-medium">
                          {item.hard_violations[0] || 'Ineligible'}
                        </span>

                        {/* Actionable View Shunt Plan button ONLY for stabling blockage */}
                        {blockageViolation && (
                          <button
                            onClick={() => {
                              if (onOpenShuntPlan) onOpenShuntPlan(item.train_id, blockageViolation);
                            }}
                            className="text-[#2563EB] hover:underline font-mono text-[11px] font-medium"
                          >
                            View shunt plan →
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Score */}
                  <td className="py-3.5 px-4 font-mono font-medium text-[#0F172A]">
                    {item.is_eligible ? `${(item.score * 100).toFixed(1)}%` : '0.0%'}
                  </td>

                  {/* Trace */}
                  <td className="py-3.5 px-4 text-[#64748B] max-w-md truncate">
                    {item.reason_trace && item.reason_trace.length > 1 ? item.reason_trace[1] : 'Standard evaluation'}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right space-x-2 font-medium">
                    <button
                      onClick={() => onSelectTrainForTrace(item)}
                      className="px-2.5 py-1 bg-white hover:bg-[#F7F8FA] text-[#0F172A] border border-[#E4E7EC] rounded text-xs transition"
                    >
                      Trace
                    </button>
                    <button
                      onClick={() => onSelectTrainForOverride(item)}
                      className="px-2.5 py-1 bg-white hover:bg-[#F7F8FA] text-[#D97706] border border-[#E4E7EC] rounded text-xs transition"
                    >
                      Override
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
