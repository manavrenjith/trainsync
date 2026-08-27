import React, { useState } from 'react';

export default function OverrideModal({ decision, onClose, onSubmitOverride, isSubmitting }) {
  const [newDecision, setNewDecision] = useState(decision?.decision || 'STANDBY');
  const [overrideReason, setOverrideReason] = useState('');
  const [supervisorName, setSupervisorName] = useState('Depot Controller');
  const [error, setError] = useState('');

  if (!decision) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      setError('Operational audit reason is required for manual override.');
      return;
    }
    setError('');
    onSubmitOverride({
      eval_date: decision.eval_date,
      train_id: decision.train_id,
      new_decision: newDecision,
      override_reason: overrideReason,
      decided_by: supervisorName
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg bg-white border border-[#E4E7EC] rounded-md shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#E4E7EC] flex items-center justify-between bg-[#F7F8FA]">
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A]">Supervisor Decision Override</h3>
            <p className="text-xs text-[#64748B]">Target Train: <span className="font-mono font-semibold text-[#0F172A]">{decision.train_id}</span></p>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#0F172A] text-xs font-mono">
            [Close]
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-[#F7F8FA] border border-[#DC2626]/30 rounded text-[#DC2626]">
              {error}
            </div>
          )}

          {/* Current Decision */}
          <div className="bg-[#F7F8FA] p-3 rounded border border-[#E4E7EC] flex items-center justify-between">
            <span className="text-[#64748B]">System Proposed State:</span>
            <span className="font-semibold text-[#0F172A]">{decision.decision}</span>
          </div>

          {/* New Decision Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#0F172A] block">
              New Target State:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['INDUCT', 'STANDBY', 'IBL'].map(opt => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setNewDecision(opt)}
                  className={`py-2 px-3 rounded font-medium transition border text-xs ${
                    newDecision === opt
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-white text-[#64748B] border-[#E4E7EC] hover:bg-[#F7F8FA]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Supervisor Name */}
          <div className="space-y-1">
            <label className="text-[#64748B] block">Supervisor Identity / Role:</label>
            <input
              type="text"
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              className="w-full bg-white border border-[#E4E7EC] rounded px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              required
            />
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <label className="text-[#64748B] block">Audited Rationale (Mandatory):</label>
            <textarea
              rows={3}
              placeholder="State explicit operational rationale for overriding decision..."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="w-full bg-white border border-[#E4E7EC] rounded p-2.5 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB]"
              required
            />
          </div>

          <div className="pt-3 border-t border-[#E4E7EC] flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-[#64748B] hover:text-[#0F172A]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Commit Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
