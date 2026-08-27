import React from 'react';

export default function StablingDiagram({ plan, onSelectTrain }) {
  // Map plan decisions by train_id
  const planMap = {};
  if (plan) {
    plan.forEach(item => {
      planMap[item.train_id] = item;
    });
  }

  // 9 Tracks, 3 Positions per track (25 trains across tracks)
  const tracks = Array.from({ length: 9 }, (_, i) => {
    const trackNum = i + 1;
    const trackName = `TRK-${trackNum.toString().padStart(2, '0')}`;
    const trainPositions = [1, 2, 3].map(pos => {
      const trainIndex = (i * 3) + pos;
      if (trainIndex > 25) return null;
      const trainId = `KMRL-${trainIndex.toString().padStart(3, '0')}`;
      const dec = planMap[trainId];
      return {
        pos,
        trainId,
        decision: dec ? dec.decision : 'STANDBY',
        isEligible: dec ? dec.is_eligible : true,
        hardViolations: dec ? dec.hard_violations : []
      };
    }).filter(Boolean);

    return { trackNum, trackName, trainPositions };
  });

  return (
    <div className="bg-[#F7F8FA] border border-[#E4E7EC] rounded-md p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-3">
        <div>
          <h3 className="text-xs font-semibold text-[#0F172A] tracking-tight">
            Muttom Depot • Stabling Yard Layout & Turnout Paths
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Sequential stabling geometry & physical turnout blockage indicators.
          </p>
        </div>

        {/* Muted Legend */}
        <div className="flex items-center space-x-4 text-xs font-medium text-[#64748B]">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
            <span>Induct</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
            <span>Standby</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
            <span>IBL / Blocked</span>
          </div>
        </div>
      </div>

      {/* Yard Tracks Line Diagram */}
      <div className="space-y-2.5 overflow-x-auto pt-1">
        {tracks.map(trk => (
          <div key={trk.trackName} className="flex items-center space-x-3 text-xs">
            {/* Track Label */}
            <div className="w-14 font-mono text-[11px] font-medium text-[#64748B] bg-white px-2 py-1 border border-[#E4E7EC] rounded text-center shrink-0">
              {trk.trackName}
            </div>

            {/* Rail Line Track Segment */}
            <div className="flex-1 flex items-center space-x-2 relative py-1">
              {/* Underlying 1px thin rail line */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-[#E4E7EC] z-0"></div>

              {trk.trainPositions.map(tp => {
                const isInduct = tp.decision === 'INDUCT';
                const isStandby = tp.decision === 'STANDBY';
                const dotColor = isInduct ? 'bg-[#16A34A]' : isStandby ? 'bg-[#D97706]' : 'bg-[#DC2626]';

                return (
                  <div
                    key={tp.trainId}
                    onClick={() => onSelectTrain && onSelectTrain(tp.trainId)}
                    className="relative z-10 flex-1 max-w-[170px] bg-white border border-[#E4E7EC] hover:border-[#2563EB] px-3 py-1.5 rounded transition cursor-pointer flex items-center justify-between font-mono text-xs text-[#0F172A]"
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}></span>
                      <span className="font-semibold">{tp.trainId}</span>
                    </div>

                    <span className="text-[10px] text-[#64748B]">P{tp.pos}</span>
                  </div>
                );
              })}
            </div>

            <div className="text-[10px] font-mono text-[#64748B] shrink-0 pl-1">
              → Mainline
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
