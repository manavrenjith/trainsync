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
    <div className="space-y-6 text-xs text-[#0F172A]">
      {/* Intro Panel */}
      <div className="bg-[#F7F8FA] border border-[#E4E7EC] rounded-md p-5">
        <h2 className="text-sm font-semibold text-[#0F172A]">
          What-If Fleet Scenario Simulator
        </h2>
        <p className="text-xs text-[#64748B] mt-1">
          Simulate operational disruptions (unexpected cert expirations, sudden work orders, or changed fleet target counts) to observe engine re-optimization without mutating the committed plan in the database.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="bg-white border border-[#E4E7EC] rounded-md p-5 space-y-5">
          <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wide border-b border-[#E4E7EC] pb-2">
            Simulated Parameters
          </h3>

          {/* Target Count */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Target Revenue Count:</span>
              <span className="font-mono font-semibold text-[#2563EB]">{targetInductionCount} trains</span>
            </div>
            <input
              type="range"
              min="10"
              max="22"
              value={targetInductionCount}
              onChange={(e) => setTargetInductionCount(parseInt(e.target.value))}
              className="w-full accent-[#2563EB] cursor-pointer"
            />
          </div>

          {/* Simulate Expired Cert */}
          <div className="space-y-2">
            <label className="text-[#64748B] block font-medium">
              Simulate Expired Certs:
            </label>
            <div className="max-h-40 overflow-y-auto bg-[#F7F8FA] border border-[#E4E7EC] rounded p-2.5 space-y-1">
              {trains.slice(0, 15).map(t => (
                <label key={t.train_id} className="flex items-center space-x-2 text-[#64748B] hover:text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={expiredCertTrains.includes(t.train_id)}
                    onChange={() => toggleExpiredCert(t.train_id)}
                    className="accent-[#DC2626] rounded"
                  />
                  <span className="font-mono text-xs">{t.train_id} ({t.name})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Simulate Critical Work Order */}
          <div className="space-y-2">
            <label className="text-[#64748B] block font-medium">
              Simulate Critical Work Orders:
            </label>
            <div className="max-h-40 overflow-y-auto bg-[#F7F8FA] border border-[#E4E7EC] rounded p-2.5 space-y-1">
              {trains.slice(0, 15).map(t => (
                <label key={t.train_id} className="flex items-center space-x-2 text-[#64748B] hover:text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={criticalJobTrains.includes(t.train_id)}
                    onChange={() => toggleCriticalJob(t.train_id)}
                    className="accent-[#D97706] rounded"
                  />
                  <span className="font-mono text-xs">{t.train_id} ({t.name})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Execute Button */}
          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium py-2 rounded transition disabled:opacity-50"
          >
            {simulating ? 'Running...' : 'Execute Simulation'}
          </button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {!simulationResult ? (
            <div className="bg-[#F7F8FA] border border-[#E4E7EC] rounded-md p-12 text-center text-xs text-[#64748B]">
              Set parameters on the left and click 'Execute Simulation' to compute plan diffs.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Output Header */}
              <div className="bg-[#F7F8FA] border border-[#E4E7EC] rounded-md px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#0F172A]">Simulation Output:</span>{' '}
                  <span className="text-[#D97706] font-medium">{simulationResult.changes_count} Re-assignments Detected</span>
                </div>
              </div>

              {/* Delta Summary */}
              <div className="bg-white border border-[#E4E7EC] rounded-md p-4 space-y-2 font-mono">
                <h4 className="text-xs font-semibold text-[#0F172A] font-sans">Plan Delta Trace</h4>
                <div className="bg-[#F7F8FA] border border-[#E4E7EC] rounded p-3 space-y-1 text-xs text-[#0F172A]">
                  {simulationResult.diff_summary.length === 0 ? (
                    <p className="text-[#64748B]">Zero decision changes occurred.</p>
                  ) : (
                    simulationResult.diff_summary.map((diff, i) => (
                      <p key={i} className="py-0.5 border-b border-[#E4E7EC] last:border-0">
                        • {diff}
                      </p>
                    ))
                  )}
                </div>
              </div>

              {/* Comparison Table */}
              <div className="bg-white border border-[#E4E7EC] rounded-md overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F7F8FA] border-b border-[#E4E7EC] text-[#64748B] font-semibold">
                      <th className="py-2.5 px-3">Train ID</th>
                      <th className="py-2.5 px-3">Committed Plan</th>
                      <th className="py-2.5 px-3">Simulated Plan</th>
                      <th className="py-2.5 px-3">Delta Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E7EC]">
                    {simulationResult.simulated_plan.map(sim => {
                      const orig = simulationResult.original_plan.find(o => o.train_id === sim.train_id);
                      const isChanged = orig && orig.decision !== sim.decision;
                      return (
                        <tr key={sim.train_id} className={isChanged ? 'bg-[#F7F8FA]' : ''}>
                          <td className="py-2 px-3 font-mono font-semibold text-[#0F172A]">{sim.train_id}</td>
                          <td className="py-2 px-3 text-[#64748B]">{orig?.decision}</td>
                          <td className="py-2 px-3 font-semibold text-[#0F172A]">{sim.decision}</td>
                          <td className="py-2 px-3">
                            {isChanged ? (
                              <span className="text-[#D97706] font-semibold">[Re-assigned]</span>
                            ) : (
                              <span className="text-[#64748B]">Unchanged</span>
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
