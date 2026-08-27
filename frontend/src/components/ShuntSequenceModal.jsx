import React, { useState } from 'react';

export default function ShuntSequenceModal({ blockedTrainId, blockedReason, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!blockedTrainId) return null;

  // Extract blocking trains from reason text or default fallback
  // e.g. "Stabling line exit physically blocked by trains: KMRL-023, KMRL-024, KMRL-025"
  let blockers = [];
  if (blockedReason && blockedReason.includes('blocked by trains:')) {
    const raw = blockedReason.split('blocked by trains:')[1];
    blockers = raw.split(',').map(s => s.trim()).filter(Boolean);
  } else {
    blockers = ['KMRL-023', 'KMRL-024', 'KMRL-025'];
  }

  // Compute shunt sequence: blockers ordered from exit inward to target train (P1)
  // Reversing blockers array so highest position (closest to exit) comes first for shunting
  const sortedBlockers = [...blockers].reverse();

  const steps = [];
  sortedBlockers.forEach((bId, idx) => {
    const origIdx = blockers.indexOf(bId);
    const pos = origIdx !== -1 ? origIdx + 2 : blockers.length + 1 - idx;
    const dist = (sortedBlockers.length - idx) * 15;
    steps.push({
      stepNumber: idx + 1,
      trainId: bId,
      position: `P${pos}`,
      distance: `${dist}m`,
      action: `Shunt ${bId} out first — located at Position P${pos} (${dist}m from turnout exit)`,
      detail: `Move ${bId} to temporary depot siding track S-0${idx + 1} to clear track segment.`
    });
  });

  // Final step: target train is cleared
  steps.push({
    stepNumber: steps.length + 1,
    trainId: blockedTrainId,
    position: 'P1',
    distance: '0m (Clear)',
    action: `Target train ${blockedTrainId} is now CLEAR to exit directly to the mainline!`,
    detail: `All shunting obstructions removed. Trainset ${blockedTrainId} is clear for turnout dispatch.`
  });

  const totalSteps = steps.length;
  const activeStep = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 flex items-center justify-center p-4 font-sans text-xs text-[#0F172A]">
      <div className="w-full max-w-xl bg-white border border-[#E4E7EC] rounded-md shadow-lg overflow-hidden flex flex-col justify-between">
        {/* Header */}
        <div className="p-4 border-b border-[#E4E7EC] bg-[#F7F8FA] flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
              <h3 className="font-semibold text-sm text-[#0F172A]">
                Shunt Sequence Plan • {blockedTrainId}
              </h3>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5 font-mono">
              Computed Turnout Extraction Sequence (Depot Track TRK-08)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0F172A] text-xs font-mono"
          >
            [Close]
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Stepper Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span className="font-mono font-medium">Shunting Progress</span>
              <span className="font-mono font-semibold text-[#0F172A]">
                Step {currentStep + 1} of {totalSteps}
              </span>
            </div>
            <div className="w-full bg-[#F7F8FA] border border-[#E4E7EC] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#2563EB] h-full transition-all duration-300 rounded-full"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Physical Bay Order Visualization */}
          <div className="bg-[#F7F8FA] border border-[#E4E7EC] rounded p-3 space-y-2 font-mono">
            <span className="text-[11px] font-semibold text-[#64748B] block uppercase">
              Physical Track Position Diagram
            </span>
            <div className="flex items-center space-x-2">
              <div className="text-[10px] text-[#64748B] shrink-0">Yard End</div>
              <div className="flex-1 flex items-center space-x-1.5 overflow-x-auto">
                <div className={`flex-1 p-2 rounded border text-center text-xs transition ${
                  activeStep.trainId === blockedTrainId ? 'bg-[#2563EB] text-white border-[#2563EB] font-bold' : 'bg-white text-[#0F172A] border-[#E4E7EC]'
                }`}>
                  <div className="flex items-center justify-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
                    <span>{blockedTrainId} (P1)</span>
                  </div>
                </div>

                {blockers.map((bId, idx) => {
                  const isActive = activeStep.trainId === bId;
                  const bayNum = idx + 2;
                  return (
                    <div
                      key={bId}
                      className={`flex-1 p-2 rounded border text-center text-xs transition ${
                        isActive ? 'bg-[#2563EB] text-white border-[#2563EB] font-bold' : 'bg-white text-[#0F172A] border-[#E4E7EC]'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
                        <span>{bId} (P{bayNum})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-[#2563EB] font-semibold shrink-0">Turnout Exit →</div>
            </div>
          </div>

          {/* Active Step Directive Box */}
          <div className={`p-4 rounded border font-mono space-y-1.5 ${
            currentStep === totalSteps - 1
              ? 'bg-[#F7F8FA] border-[#16A34A]/40 text-[#16A34A]'
              : 'bg-[#F7F8FA] border-[#2563EB]/40 text-[#0F172A]'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase text-xs">
                Step {activeStep.stepNumber}: {activeStep.trainId}
              </span>
              <span className="text-[10px] text-[#64748B] bg-white px-2 py-0.5 border border-[#E4E7EC] rounded">
                Position {activeStep.position}
              </span>
            </div>
            <p className="font-sans text-xs font-medium text-[#0F172A]">
              {activeStep.action}
            </p>
            <p className="font-sans text-xs text-[#64748B]">
              {activeStep.detail}
            </p>
          </div>
        </div>

        {/* Footer Stepper Controls */}
        <div className="p-4 border-t border-[#E4E7EC] bg-[#F7F8FA] flex items-center justify-between font-mono text-xs">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-3 py-1.5 bg-white border border-[#E4E7EC] rounded hover:bg-[#E4E7EC] disabled:opacity-40 transition font-medium"
          >
            ← Previous Step
          </button>

          <span className="text-[#64748B]">
            {currentStep + 1} / {totalSteps}
          </span>

          <button
            onClick={() => setCurrentStep(prev => Math.min(totalSteps - 1, prev + 1))}
            disabled={currentStep === totalSteps - 1}
            className="px-4 py-1.5 bg-[#2563EB] text-white rounded hover:bg-[#1D4ED8] disabled:opacity-40 transition font-semibold"
          >
            Next Step →
          </button>
        </div>
      </div>
    </div>
  );
}
