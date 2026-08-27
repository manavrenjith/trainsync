import React, { useState } from 'react';
import StablingDiagram from './StablingDiagram';
import { Wrench } from 'lucide-react';

export default function DailyPlanView({
  plan,
  loading,
  onSelectTrainForTrace,
  onSelectTrainForOverride,
  onSelectTrainDetail
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDecision, setFilterDecision] = useState('ALL');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-8 h-8 border-2 border-[#5B8FB0] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-[#9E9E96]">Processing fleet constraint evaluation engine...</p>
      </div>
    );
  }

  // Operational Counts
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
      {/* Horizontal Status Strip */}
      <div className="depot-panel px-6 py-3 flex flex-wrap items-center justify-between text-xs font-mono border-l-4 border-l-[#5B8FB0]">
        <div className="flex items-center space-x-6">
          <div>
            <span className="text-[#9E9E96]">FLEET TOTAL:</span>{' '}
            <span className="font-bold text-[#E8E6DF]">{totalCount}</span>
          </div>

          <div className="h-3 w-px bg-[#28323E]"></div>

          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3FA34D]"></span>
            <span className="text-[#9E9E96]">INDUCT:</span>{' '}
            <span className="font-bold text-[#3FA34D]">{inductCount}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E0A526]"></span>
            <span className="text-[#9E9E96]">STANDBY:</span>{' '}
            <span className="font-bold text-[#E0A526]">{standbyCount}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C4433A]"></span>
            <span className="text-[#9E9E96]">IBL MAINTENANCE:</span>{' '}
            <span className="font-bold text-[#C4433A]">{iblCount}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[#C4433A] bg-[#1C1214] px-3 py-1 border border-[#C4433A]/30 rounded">
          <span className="w-2 h-2 rounded-full bg-[#C4433A] animate-pulse"></span>
          <span>HARD CONSTRAINTS BLOCKED: {hardViolationsCount} TRAINS</span>
        </div>
      </div>

      {/* Signature Element: Stabling Yard Layout Diagram */}
      <StablingDiagram plan={plan} onSelectTrain={onSelectTrainDetail} />

      {/* Manifest Filter Toolbar */}
      <div className="depot-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="FILTER TRAIN ID (E.G. KMRL-004)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0C1116] border border-[#28323E] rounded px-3 py-1.5 text-xs font-mono text-[#E8E6DF] placeholder-[#9E9E96] focus:outline-none focus:border-[#5B8FB0]"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-1.5 w-full md:w-auto font-mono text-xs overflow-x-auto">
          {[
            { id: 'ALL', label: `ALL (${totalCount})` },
            { id: 'INDUCT', label: `INDUCT (${inductCount})` },
            { id: 'STANDBY', label: `STANDBY (${standbyCount})` },
            { id: 'IBL', label: `IBL (${iblCount})` },
            { id: 'VIOLATIONS', label: `HARD FAILS (${hardViolationsCount})` }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilterDecision(btn.id)}
              className={`px-3 py-1 rounded font-bold transition ${
                filterDecision === btn.id
                  ? 'bg-[#5B8FB0] text-[#0C1116]'
                  : 'bg-[#0C1116] text-[#9E9E96] hover:text-[#E8E6DF] border border-[#28323E]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fleet Manifest Table */}
      <div className="depot-panel overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#0C1116] border-b border-[#28323E] text-[#9E9E96] font-mono uppercase tracking-wider">
              <th className="py-3 px-4">Train ID</th>
              <th className="py-3 px-4">Decision</th>
              <th className="py-3 px-4">Compliance Status</th>
              <th className="py-3 px-4">Score</th>
              <th className="py-3 px-4">Primary Rationale Trace</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#28323E]/60 font-mono">
            {filteredPlan.map((item) => {
              const isInduct = item.decision === 'INDUCT';
              const isStandby = item.decision === 'STANDBY';
              const isIbl = item.decision === 'IBL';
              const isOverridden = !!item.override_of;

              return (
                <tr
                  key={item.train_id}
                  className={`hover:bg-[#1C242D]/50 transition ${
                    !item.is_eligible ? 'bg-[#1C1214]/60' : ''
                  } ${isOverridden ? 'border-l-2 border-l-[#E0A526]' : ''}`}
                >
                  {/* Train ID */}
                  <td className="py-3 px-4 font-bold text-[#E8E6DF]">
                    <button
                      onClick={() => onSelectTrainDetail(item.train_id)}
                      className="hover:text-[#5B8FB0] text-left underline decoration-[#28323E] underline-offset-4"
                    >
                      {item.train_id}
                    </button>
                    {isOverridden && (
                      <span className="ml-2 text-[10px] text-[#E0A526] font-normal">[OVERRIDDEN]</span>
                    )}
                  </td>

                  {/* Decision with solid signal dot */}
                  <td className="py-3 px-4 font-bold">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isInduct ? 'bg-[#3FA34D]' : isStandby ? 'bg-[#E0A526]' : 'bg-[#C4433A]'
                      }`}></span>
                      <span className={isInduct ? 'text-[#3FA34D]' : isStandby ? 'text-[#E0A526]' : 'text-[#C4433A]'}>
                        {isInduct ? 'Induct' : isStandby ? 'Standby' : 'IBL'}
                      </span>
                    </div>
                  </td>

                  {/* Compliance */}
                  <td className="py-3 px-4">
                    {item.is_eligible ? (
                      <span className="text-[#3FA34D] flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3FA34D]"></span>
                        <span>Pass</span>
                      </span>
                    ) : (
                      <span className="text-[#C4433A] font-bold flex items-center space-x-1">
                        {item.hard_violations.some(v => v.includes('job-card')) && (
                          <Wrench className="w-3.5 h-3.5 text-[#C4433A] inline mr-1" />
                        )}
                        <span>{item.hard_violations[0] || 'Hard Fail'}</span>
                      </span>
                    )}
                  </td>

                  {/* Score */}
                  <td className="py-3 px-4 font-bold text-[#5B8FB0]">
                    {item.is_eligible ? `${(item.score * 100).toFixed(1)}%` : '0.0%'}
                  </td>

                  {/* Rationale */}
                  <td className="py-3 px-4 text-[#9E9E96] font-sans text-xs max-w-md truncate">
                    {item.reason_trace && item.reason_trace.length > 1 ? item.reason_trace[1] : 'Standard evaluation'}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => onSelectTrainForTrace(item)}
                      className="px-2.5 py-1 bg-[#0C1116] hover:bg-[#1C242D] text-[#5B8FB0] border border-[#28323E] rounded font-bold text-[11px]"
                    >
                      Trace
                    </button>
                    <button
                      onClick={() => onSelectTrainForOverride(item)}
                      className="px-2.5 py-1 bg-[#0C1116] hover:bg-[#1C242D] text-[#E0A526] border border-[#28323E] rounded font-bold text-[11px]"
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
