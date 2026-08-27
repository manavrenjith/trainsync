import React, { useState } from 'react';
import ShuntSequenceModal from './ShuntSequenceModal';

export default function ExplanationDrawer({ decision, onClose }) {
  const [shuntModalTrainId, setShuntModalTrainId] = useState(null);
  const [shuntModalReason, setShuntModalReason] = useState(null);

  if (!decision) return null;

  const breakdown = decision.soft_breakdown || {};
  const isInduct = decision.decision === 'INDUCT';
  const isStandby = decision.decision === 'STANDBY';
  const dotColor = isInduct ? 'bg-[#16A34A]' : isStandby ? 'bg-[#D97706]' : 'bg-[#DC2626]';

  // Find if there is a stabling blockage violation
  const blockageViolation = decision.hard_violations && decision.hard_violations.find(v => v.toLowerCase().includes('blocked'));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 flex justify-end font-sans">
      <div className="w-full max-w-xl bg-white border-l border-[#E4E7EC] h-full overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="p-5 border-b border-[#E4E7EC] flex items-center justify-between sticky top-0 bg-white z-10">
            <div>
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`}></span>
                <h2 className="font-mono text-base font-bold text-[#0F172A]">{decision.train_id}</h2>
                <span className="text-xs font-medium text-[#64748B]">({decision.decision})</span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">Decision Explanation & Audit Trace</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-[#64748B] hover:text-[#0F172A] text-xs font-mono"
            >
              [Close]
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Banner */}
            <div className={`p-4 rounded border text-xs ${
              decision.is_eligible
                ? 'bg-[#F7F8FA] border-[#16A34A]/30 text-[#16A34A]'
                : 'bg-[#F7F8FA] border-[#DC2626]/30 text-[#DC2626]'
            }`}>
              <div className="flex items-center justify-between">
                <div className="font-semibold">
                  {decision.is_eligible ? 'Pass: All Hard Constraints Satisfied' : 'Fail: Hard Constraint Violation Detected'}
                </div>

                {/* Specific "View shunt plan" trigger if stabling blockage */}
                {blockageViolation && (
                  <button
                    onClick={() => {
                      setShuntModalTrainId(decision.train_id);
                      setShuntModalReason(blockageViolation);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-[#F7F8FA] text-[#2563EB] border border-[#2563EB]/40 rounded font-mono font-medium text-xs transition"
                  >
                    View shunt plan →
                  </button>
                )}
              </div>

              <p className="text-[#64748B] mt-1">
                {decision.is_eligible
                  ? 'Department fitness certificates valid. Zero open critical work orders.'
                  : `${decision.hard_violations.length} critical constraint failure(s) prevent revenue induction.`}
              </p>
            </div>

            {/* Trace List */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-[#0F172A] uppercase">
                Logic & Reason Trace
              </h3>
              <div className="bg-[#F7F8FA] border border-[#E4E7EC] rounded p-4 space-y-2 text-xs text-[#0F172A]">
                {decision.reason_trace && decision.reason_trace.map((trace, idx) => {
                  const isBlockageTrace = trace.toLowerCase().includes('blocked');
                  return (
                    <div key={idx} className="py-1 border-b border-[#E4E7EC] last:border-0 flex items-center justify-between">
                      <span>{trace}</span>
                      {isBlockageTrace && (
                        <button
                          onClick={() => {
                            setShuntModalTrainId(decision.train_id);
                            setShuntModalReason(trace);
                          }}
                          className="ml-2 px-2 py-0.5 text-[11px] font-mono font-medium text-[#2563EB] hover:underline shrink-0"
                        >
                          View shunt plan →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sub-score breakdown */}
            {decision.is_eligible && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[#0F172A] uppercase">
                  Multi-Objective Sub-Scores
                </h3>

                <div className="bg-[#F7F8FA] border border-[#E4E7EC] rounded p-4 space-y-3">
                  {[
                    { label: 'Branding SLA Urgency (35%)', val: breakdown.branding_urgency_score },
                    { label: 'Fleet Mileage Balance (30%)', val: breakdown.mileage_balance_score },
                    { label: 'Job-Card Risk Penalty (15%)', val: breakdown.job_card_penalty_score },
                    { label: 'Cleaning Slot Readiness (10%)', val: breakdown.cleaning_readiness_score },
                    { label: 'Stabling Track Ease (10%)', val: breakdown.stabling_ease_score }
                  ].map((sub, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between text-[#64748B]">
                        <span>{sub.label}</span>
                        <span className="font-mono font-medium text-[#0F172A]">{((sub.val || 0) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-white rounded-full h-1.5 overflow-hidden border border-[#E4E7EC]">
                        <div
                          className="h-full bg-[#2563EB]"
                          style={{ width: `${Math.min(100, (sub.val || 0) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-[#E4E7EC] flex items-center justify-between text-xs font-medium">
                    <span className="text-[#0F172A]">Composite Score</span>
                    <span className="text-sm font-bold font-mono text-[#2563EB]">
                      {((decision.score || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-[#E4E7EC] bg-white">
          <button
            onClick={onClose}
            className="w-full bg-[#F7F8FA] hover:bg-[#E4E7EC] text-[#0F172A] text-xs font-medium py-2 rounded border border-[#E4E7EC] transition"
          >
            Close Trace
          </button>
        </div>
      </div>

      {/* Shunt Sequence Modal Triggered On Demand */}
      {shuntModalTrainId && (
        <ShuntSequenceModal
          blockedTrainId={shuntModalTrainId}
          blockedReason={shuntModalReason}
          onClose={() => {
            setShuntModalTrainId(null);
            setShuntModalReason(null);
          }}
        />
      )}
    </div>
  );
}
