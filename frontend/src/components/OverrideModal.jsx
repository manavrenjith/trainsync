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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#141B22] border border-[#28323E] rounded shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 border-b border-[#28323E] flex items-center justify-between bg-[#0C1116]">
          <div>
            <h3 className="font-display text-base font-bold text-[#E8E6DF]">Supervisor Decision Override</h3>
            <p className="text-xs font-mono text-[#9E9E96]">Train Target: <span className="text-[#E8E6DF] font-bold">{decision.train_id}</span></p>
          </div>
          <button onClick={onClose} className="text-[#9E9E96] hover:text-[#E8E6DF] font-mono text-xs">
            [ESC]
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-[#1C1214] border border-[#C4433A]/50 rounded text-xs text-[#C4433A] font-mono">
              {error}
            </div>
          )}

          {/* Current Decision */}
          <div className="bg-[#0C1116] p-3 rounded border border-[#28323E] flex items-center justify-between text-xs font-mono">
            <span className="text-[#9E9E96]">System Proposed State:</span>
            <span className="font-bold text-[#E8E6DF] px-2 py-0.5 bg-[#1C242D] rounded">{decision.decision}</span>
          </div>

          {/* New Decision Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-[#E8E6DF] uppercase block">
              New Target Decision State:
            </label>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              {['INDUCT', 'STANDBY', 'IBL'].map(opt => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setNewDecision(opt)}
                  className={`py-2 px-3 rounded font-bold transition border ${
                    newDecision === opt
                      ? opt === 'INDUCT'
                        ? 'bg-[#121E15] text-[#3FA34D] border-[#3FA34D]'
                        : opt === 'STANDBY'
                        ? 'bg-[#221B10] text-[#E0A526] border-[#E0A526]'
                        : 'bg-[#1C1214] text-[#C4433A] border-[#C4433A]'
                      : 'bg-[#0C1116] text-[#9E9E96] border-[#28323E] hover:bg-[#1C242D]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Supervisor Identity */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-[#9E9E96] block">Supervisor Identity / Role:</label>
            <input
              type="text"
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              className="w-full bg-[#0C1116] border border-[#28323E] rounded px-3 py-1.5 text-xs font-mono text-[#E8E6DF] focus:outline-none focus:border-[#5B8FB0]"
              required
            />
          </div>

          {/* Override Reason */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-[#9E9E96] block">Audited Rationale (Mandatory):</label>
            <textarea
              rows={3}
              placeholder="State explicit operational rationale for overriding decision..."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="w-full bg-[#0C1116] border border-[#28323E] rounded p-2.5 text-xs font-sans text-[#E8E6DF] placeholder-[#9E9E96] focus:outline-none focus:border-[#5B8FB0]"
              required
            />
          </div>

          <div className="pt-3 border-t border-[#28323E] flex items-center justify-end space-x-2 font-mono text-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-[#9E9E96] hover:text-[#E8E6DF]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 font-bold bg-[#5B8FB0] text-[#0C1116] hover:bg-[#5B8FB0]/90 rounded transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Commit Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
