import React from 'react';
import { X, Wrench } from 'lucide-react';

export default function ExplanationDrawer({ decision, onClose }) {
  if (!decision) return null;

  const breakdown = decision.soft_breakdown || {};

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 flex justify-end font-sans">
      <div className="w-full max-w-xl bg-[#141B22] border-l border-[#28323E] h-full overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Drawer Header */}
          <div className="p-5 border-b border-[#28323E] flex items-center justify-between sticky top-0 bg-[#141B22] z-10">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="font-display text-lg font-bold text-[#E8E6DF]">{decision.train_id}</h2>
                <div className="flex items-center space-x-1.5 font-mono text-xs">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    decision.decision === 'INDUCT' ? 'bg-[#3FA34D]' : decision.decision === 'STANDBY' ? 'bg-[#E0A526]' : 'bg-[#C4433A]'
                  }`}></span>
                  <span className={decision.decision === 'INDUCT' ? 'text-[#3FA34D]' : decision.decision === 'STANDBY' ? 'text-[#E0A526]' : 'text-[#C4433A]'}>
                    {decision.decision}
                  </span>
                </div>
              </div>
              <p className="text-xs font-mono text-[#9E9E96] mt-0.5">Decision Explanation & Constraint Audit Trace</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-[#9E9E96] hover:text-[#E8E6DF] hover:bg-[#0C1116] font-mono text-xs border border-[#28323E]"
            >
              [ESC]
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Banner */}
            <div className={`p-4 rounded border font-mono text-xs ${
              decision.is_eligible
                ? 'bg-[#121E15] border-[#3FA34D]/50 text-[#3FA34D]'
                : 'bg-[#1C1214] border-[#C4433A]/50 text-[#C4433A]'
            }`}>
              <div className="font-bold">
                {decision.is_eligible ? 'PASS: All Hard Constraints Satisfied' : 'FAIL: Hard Constraint Violation Detected'}
              </div>
              <p className="text-[#E8E6DF]/80 mt-1 font-sans">
                {decision.is_eligible
                  ? 'Department certificates valid. Zero open critical work orders.'
                  : `${decision.hard_violations.length} critical constraint failure(s) prevent revenue induction.`}
              </p>
            </div>

            {/* Decision Trace List */}
            <div className="space-y-2">
              <h3 className="font-display text-xs font-bold uppercase text-[#5B8FB0] tracking-wider">
                Logic & Reason Trace
              </h3>
              <div className="bg-[#0C1116] border border-[#28323E] rounded p-4 space-y-2 font-mono text-xs text-[#E8E6DF]">
                {decision.reason_trace && decision.reason_trace.map((trace, idx) => (
                  <p key={idx} className="py-1 border-b border-[#28323E]/50 last:border-0">
                    {trace}
                  </p>
                ))}
              </div>
            </div>

            {/* Sub-score breakdown */}
            {decision.is_eligible && (
              <div className="space-y-3">
                <h3 className="font-display text-xs font-bold uppercase text-[#5B8FB0] tracking-wider">
                  Sub-Score Multi-Objective Factor Weighting
                </h3>

                <div className="bg-[#0C1116] border border-[#28323E] rounded p-4 space-y-3">
                  {[
                    { label: 'Branding SLA Urgency (35%)', val: breakdown.branding_urgency_score },
                    { label: 'Fleet Mileage Balance (30%)', val: breakdown.mileage_balance_score },
                    { label: 'Job-Card Risk Penalty (15%)', val: breakdown.job_card_penalty_score },
                    { label: 'Cleaning Slot Readiness (10%)', val: breakdown.cleaning_readiness_score },
                    { label: 'Stabling Track Ease (10%)', val: breakdown.stabling_ease_score }
                  ].map((sub, idx) => (
                    <div key={idx} className="space-y-1 font-mono text-xs">
                      <div className="flex justify-between text-[#9E9E96]">
                        <span>{sub.label}</span>
                        <span className="font-bold text-[#E8E6DF]">{((sub.val || 0) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-[#141B22] rounded-sm h-1.5 overflow-hidden border border-[#28323E]">
                        <div
                          className="h-full bg-[#5B8FB0]"
                          style={{ width: `${Math.min(100, (sub.val || 0) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-[#28323E] flex items-center justify-between font-mono">
                    <span className="text-xs font-bold text-[#E8E6DF]">Composite Priority Score</span>
                    <span className="text-base font-bold text-[#5B8FB0]">
                      {((decision.score || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-[#28323E] bg-[#141B22]">
          <button
            onClick={onClose}
            className="w-full bg-[#0C1116] hover:bg-[#1C242D] text-[#E8E6DF] font-mono text-xs font-bold py-2.5 rounded border border-[#28323E] transition"
          >
            Close Trace Window
          </button>
        </div>
      </div>
    </div>
  );
}
