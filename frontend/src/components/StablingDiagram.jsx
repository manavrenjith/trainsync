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
    <div className="depot-panel p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#28323E] pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-display text-base font-bold text-[#E8E6DF] tracking-wider uppercase">
              Muttom Depot • Stabling Yard Line Geometry
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#1C242D] text-[#5B8FB0] border border-[#28323E] rounded">
              SCHEMATIC REV 4.2
            </span>
          </div>
          <p className="text-xs text-[#9E9E96] mt-0.5">
            Physical track layout & turnout shunting constraints. Red track segments indicate shunting exit blockages.
          </p>
        </div>

        {/* Operational Legend */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3FA34D]"></span>
            <span className="text-[#9E9E96]">Induct Line</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E0A526]"></span>
            <span className="text-[#9E9E96]">Standby Yard</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C4433A]"></span>
            <span className="text-[#9E9E96]">IBL / Blocked</span>
          </div>
        </div>
      </div>

      {/* Yard Track Diagram */}
      <div className="space-y-3 overflow-x-auto pt-1">
        {tracks.map(trk => (
          <div key={trk.trackName} className="flex items-center space-x-3 text-xs">
            {/* Track Label */}
            <div className="w-16 font-mono font-bold text-[#5B8FB0] bg-[#0C1116] px-2 py-1 border border-[#28323E] rounded text-center shrink-0">
              {trk.trackName}
            </div>

            {/* Rail Line Track Segment */}
            <div className="flex-1 flex items-center space-x-2 relative py-1">
              {/* Underlying steel rail line background */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#28323E] z-0"></div>

              {trk.trainPositions.map(tp => {
                const isInduct = tp.decision === 'INDUCT';
                const isStandby = tp.decision === 'STANDBY';
                const isIbl = tp.decision === 'IBL';
                const isBlocked = !tp.isEligible || tp.trainId === 'KMRL-022';

                return (
                  <div
                    key={tp.trainId}
                    onClick={() => onSelectTrain && onSelectTrain(tp.trainId)}
                    className={`relative z-10 flex-1 max-w-[170px] bg-[#0C1116] border px-3 py-1.5 rounded cursor-pointer transition hover:border-[#5B8FB0] flex items-center justify-between font-mono text-xs ${
                      isBlocked
                        ? 'border-[#C4433A] bg-[#1C1214]'
                        : isInduct
                        ? 'border-[#3FA34D]/60'
                        : isStandby
                        ? 'border-[#E0A526]/60'
                        : 'border-[#C4433A]/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        isInduct ? 'bg-[#3FA34D]' : isStandby ? 'bg-[#E0A526]' : 'bg-[#C4433A]'
                      }`}></span>
                      <span className="font-bold text-[#E8E6DF]">{tp.trainId}</span>
                    </div>

                    <span className="text-[10px] text-[#9E9E96]">P{tp.pos}</span>
                  </div>
                );
              })}
            </div>

            {/* Turnout Exit Indicator */}
            <div className="text-[10px] font-mono text-[#9E9E96] shrink-0 pl-2">
              ➜ Mainline Turnout
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
