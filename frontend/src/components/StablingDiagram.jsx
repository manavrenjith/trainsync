import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function StablingDiagram({ plan, onSelectTrain, targetDate = '2026-08-27' }) {
  const [cpsatResult, setCpsatResult] = useState(null);
  const [loadingSolver, setLoadingSolver] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Map plan decisions by train_id
  const planMap = {};
  if (plan) {
    plan.forEach(item => {
      planMap[item.train_id] = item;
    });
  }

  const runCPSATSolver = async () => {
    setLoadingSolver(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/plan/${targetDate}/cpsat-stabling`);
      if (!res.ok) throw new Error('Failed to run CP-SAT solver');
      const data = await res.json();
      setCpsatResult(data);
      setShowScheduleModal(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSolver(false);
    }
  };

  // 9 Tracks, 3 Positions per track (25 trains across tracks)
  const tracks = Array.from({ length: 9 }, (_, i) => {
    const trackNum = i + 1;
    const trackName = `TRK-${trackNum.toString().padStart(2, '0')}`;
    const turnoutDist = (trackNum * 15);
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

    return { trackNum, trackName, turnoutDist, trainPositions };
  });

  return (
    <div className="bg-[#F7F8FA] border border-[#E4E7EC] rounded-md p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E7EC] pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-semibold text-[#0F172A] tracking-tight">
              Muttom Depot • Stabling Yard Layout & Turnout Geometry
            </h3>
            <span className="text-[10px] bg-[#2563EB]/10 text-[#2563EB] font-mono px-2 py-0.5 rounded font-medium border border-[#2563EB]/20">
              OR-Tools CP-SAT Ready
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Sequential stabling geometry, physical turnout blockage indicators & Phase-2 departure optimization.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={runCPSATSolver}
            disabled={loadingSolver}
            className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono rounded shadow-sm font-semibold transition disabled:opacity-50 flex items-center space-x-1.5"
          >
            {loadingSolver ? (
              <span>Solving CP-SAT...</span>
            ) : (
              <>
                <span>⚡ Run Phase-2 CP-SAT Solver</span>
              </>
            )}
          </button>

          {/* Legend */}
          <div className="flex items-center space-x-3 text-xs font-medium text-[#64748B]">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
              <span>Induct</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
              <span>Standby</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
              <span>IBL / Blocked</span>
            </div>
          </div>
        </div>
      </div>

      {/* CP-SAT Solved Status Summary Banner if available */}
      {cpsatResult && (
        <div className="bg-white border border-[#2563EB]/30 rounded p-3 text-xs font-mono flex items-center justify-between text-[#0F172A] shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-[#16A34A] text-white text-[10px] rounded font-bold uppercase">
              {cpsatResult.solver_status}
            </span>
            <span>{cpsatResult.solver_summary}</span>
          </div>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="text-[#2563EB] hover:underline font-semibold"
          >
            View Timetable Schedule →
          </button>
        </div>
      )}

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

            {/* Specific Turnout Sequence Telemetry */}
            <div className="text-[10px] font-mono text-[#64748B] shrink-0 pl-1">
              Turnout T-0{trk.trackNum} ({trk.turnoutDist}m)
            </div>
          </div>
        ))}
      </div>

      {/* CP-SAT Solved Departure Timetable Modal */}
      {showScheduleModal && cpsatResult && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 flex items-center justify-center p-4 font-sans text-xs text-[#0F172A]">
          <div className="w-full max-w-2xl bg-white border border-[#E4E7EC] rounded-md shadow-lg overflow-hidden flex flex-col justify-between max-h-[85vh]">
            <div className="p-4 border-b border-[#E4E7EC] bg-[#F7F8FA] flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-[#2563EB] text-white text-[10px] rounded font-bold uppercase font-mono">
                    Google OR-Tools CP-SAT
                  </span>
                  <h3 className="font-semibold text-sm text-[#0F172A]">
                    Turnout Departure Timetable & Stabling Solution
                  </h3>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5 font-mono">
                  Solved in {cpsatResult.solver_execution_ms}ms • Status: {cpsatResult.solver_status} • Shunting Moves: {cpsatResult.total_shunting_moves}
                </p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-[#64748B] hover:text-[#0F172A] text-xs font-mono"
              >
                [Close]
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto font-mono text-xs">
              <div className="grid grid-cols-12 bg-[#F7F8FA] p-2 font-semibold text-[#64748B] border border-[#E4E7EC] rounded">
                <div className="col-span-3">Train ID</div>
                <div className="col-span-2">Decision</div>
                <div className="col-span-3">Track / Position</div>
                <div className="col-span-4">Departure Time</div>
              </div>

              {cpsatResult.assignments.map((asgn) => (
                <div key={asgn.train_id} className="grid grid-cols-12 p-2 border-b border-[#E4E7EC] items-center hover:bg-[#F7F8FA]">
                  <div className="col-span-3 font-bold text-[#0F172A]">{asgn.train_id}</div>
                  <div className="col-span-2">
                    <span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${
                      asgn.decision === 'INDUCT' ? 'bg-[#16A34A]/10 text-[#16A34A]' :
                      asgn.decision === 'STANDBY' ? 'bg-[#D97706]/10 text-[#D97706]' : 'bg-[#DC2626]/10 text-[#DC2626]'
                    }`}>
                      {asgn.decision}
                    </span>
                  </div>
                  <div className="col-span-3 text-[#64748B]">{asgn.track_name} (P{asgn.position_order})</div>
                  <div className="col-span-4 font-semibold text-[#2563EB]">
                    {asgn.scheduled_departure_time}
                    {asgn.requires_shunting && (
                      <span className="ml-2 text-[10px] text-[#DC2626] bg-[#DC2626]/10 px-1.5 py-0.5 rounded">
                        Shunt Req
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[#E4E7EC] bg-[#F7F8FA] flex items-center justify-between font-mono text-xs">
              <span className="text-[#64748B]">
                Total Scheduled: {cpsatResult.total_trains_scheduled} Trainsets
              </span>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-1.5 bg-[#0F172A] text-white rounded hover:bg-[#1E293B] font-semibold"
              >
                Close Timetable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
