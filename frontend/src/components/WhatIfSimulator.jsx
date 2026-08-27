import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function WhatIfSimulator({ selectedDate, trains }) {
  const [expiredCertTrains, setExpiredCertTrains] = useState(['KMRL-001']);
  const [criticalJobTrains, setCriticalJobTrains] = useState(['KMRL-003']);
  const [targetInductionCount, setTargetInductionCount] = useState(18);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  const toggleExpiredCert = (id) => {
    setExpiredCertTrains(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const toggleCriticalJob = (id) => {
    setCriticalJobTrains(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eval_date: selectedDate,
          expired_cert_train_ids: expiredCertTrains,
          critical_job_train_ids: criticalJobTrains,
          target_induction_count: targetInductionCount
        })
      });
      const data = await resp.json();
      setSimulationResult(data);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Panel */}
      <div className="depot-panel p-5 border-l-4 border-l-[#5B8FB0]">
        <h2 className="font-display text-base font-bold text-[#E8E6DF] uppercase tracking-wider">
          What-If Scenario Simulator
        </h2>
        <p className="text-xs text-[#9E9E96] mt-1 font-sans">
          Simulate operational disruptions (unexpected cert expirations, sudden work orders, or changed fleet target counts) to observe engine re-optimization without mutating the committed plan in the database.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="depot-panel p-5 space-y-5 font-mono text-xs">
          <h3 className="font-display text-xs font-bold text-[#5B8FB0] uppercase tracking-wider border-b border-[#28323E] pb-2">
            Simulated Perturbations
          </h3>

          {/* Target Count */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[#9E9E96]">Target Revenue Count:</span>
              <span className="font-bold text-[#5B8FB0]">{targetInductionCount} trains</span>
            </div>
            <input
              type="range"
              min="10"
              max="22"
              value={targetInductionCount}
              onChange={(e) => setTargetInductionCount(parseInt(e.target.value))}
              className="w-full accent-[#5B8FB0] cursor-pointer"
            />
          </div>

          {/* Simulate Expired Cert */}
          <div className="space-y-2">
            <label className="text-[#9E9E96] block uppercase font-bold">
              Simulate Expired Certs:
            </label>
            <div className="max-h-40 overflow-y-auto bg-[#0C1116] border border-[#28323E] rounded p-2 space-y-1">
              {trains.slice(0, 15).map(t => (
                <label key={t.train_id} className="flex items-center space-x-2 text-[#9E9E96] hover:text-[#E8E6DF] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={expiredCertTrains.includes(t.train_id)}
                    onChange={() => toggleExpiredCert(t.train_id)}
                    className="accent-[#C4433A] rounded"
                  />
                  <span>{t.train_id} ({t.name})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Simulate Critical Work Order */}
          <div className="space-y-2">
            <label className="text-[#9E9E96] block uppercase font-bold">
              Simulate Critical Work Orders:
            </label>
            <div className="max-h-40 overflow-y-auto bg-[#0C1116] border border-[#28323E] rounded p-2 space-y-1">
              {trains.slice(0, 15).map(t => (
                <label key={t.train_id} className="flex items-center space-x-2 text-[#9E9E96] hover:text-[#E8E6DF] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={criticalJobTrains.includes(t.train_id)}
                    onChange={() => toggleCriticalJob(t.train_id)}
                    className="accent-[#E0A526] rounded"
                  />
                  <span>{t.train_id} ({t.name})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Execute Button */}
          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="w-full bg-[#5B8FB0] hover:bg-[#5B8FB0]/90 text-[#0C1116] font-bold py-2.5 rounded transition uppercase disabled:opacity-50"
          >
            {simulating ? 'RUNNING SIMULATION...' : 'EXECUTE SIMULATION'}
          </button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {!simulationResult ? (
            <div className="depot-panel p-12 text-center text-xs font-mono text-[#9E9E96]">
              Set parameters on the left and click 'EXECUTE SIMULATION' to compute plan diffs.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Delta Header */}
              <div className="depot-panel px-4 py-3 border-l-4 border-l-[#E0A526] flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="font-bold text-[#E8E6DF]">SIMULATION OUTPUT:</span>{' '}
                  <span className="text-[#E0A526]">{simulationResult.changes_count} RE-ASSIGNMENTS DETECTED</span>
                </div>
              </div>

              {/* Delta Summary List */}
              <div className="depot-panel p-4 space-y-2 font-mono text-xs">
                <h4 className="font-display text-xs font-bold text-[#5B8FB0] uppercase">Plan Delta Trace</h4>
                <div className="bg-[#0C1116] border border-[#28323E] rounded p-3 space-y-1">
                  {simulationResult.diff_summary.length === 0 ? (
                    <p className="text-[#9E9E96]">Zero decision changes occurred.</p>
                  ) : (
                    simulationResult.diff_summary.map((diff, i) => (
                      <p key={i} className="text-[#E8E6DF] py-0.5 border-b border-[#28323E]/50 last:border-0">
                        • {diff}
                      </p>
                    ))
                  )}
                </div>
              </div>

              {/* Side-by-side Table */}
              <div className="depot-panel overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="bg-[#0C1116] border-b border-[#28323E] text-[#9E9E96] uppercase">
                      <th className="py-2.5 px-3">Train ID</th>
                      <th className="py-2.5 px-3">Committed Plan</th>
                      <th className="py-2.5 px-3">Simulated Plan</th>
                      <th className="py-2.5 px-3">Delta Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#28323E]/60">
                    {simulationResult.simulated_plan.map(sim => {
                      const orig = simulationResult.original_plan.find(o => o.train_id === sim.train_id);
                      const isChanged = orig && orig.decision !== sim.decision;
                      return (
                        <tr key={sim.train_id} className={isChanged ? 'bg-[#221B10]/40' : ''}>
                          <td className="py-2 px-3 font-bold text-[#E8E6DF]">{sim.train_id}</td>
                          <td className="py-2 px-3 text-[#9E9E96]">{orig?.decision}</td>
                          <td className="py-2 px-3 font-bold text-[#E8E6DF]">{sim.decision}</td>
                          <td className="py-2 px-3">
                            {isChanged ? (
                              <span className="text-[#E0A526] font-bold">[RE-ASSIGNED]</span>
                            ) : (
                              <span className="text-[#9E9E96]/60">Unchanged</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
