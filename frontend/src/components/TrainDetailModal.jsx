import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

export default function TrainDetailModal({ trainId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trainId) return;
    async function fetchDetail() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/trains/${trainId}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("Failed to load train details:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [trainId]);

  if (!trainId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-3xl bg-[#141B22] border border-[#28323E] rounded shadow-2xl overflow-hidden max-h-[90vh] flex flex-col justify-between">
        {/* Header */}
        <div className="p-4 border-b border-[#28323E] flex items-center justify-between bg-[#0C1116]">
          <div>
            <div className="flex items-center space-x-3">
              <h3 className="font-display text-lg font-bold text-[#E8E6DF]">{data?.train?.train_id || trainId}</h3>
              <span className="text-xs font-mono text-[#9E9E96]">({data?.train?.name})</span>
            </div>
            <p className="text-xs font-mono text-[#9E9E96] mt-0.5">KMRL Fleet Operational Dossier</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#9E9E96] hover:text-[#E8E6DF] font-mono text-xs">
            [ESC]
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#5B8FB0] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-mono text-[#9E9E96] mt-2">Loading train record...</p>
          </div>
        ) : (
          <div className="p-5 overflow-y-auto space-y-5 font-mono text-xs">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#0C1116] p-3 rounded border border-[#28323E]">
                <p className="text-[#9E9E96] uppercase text-[10px]">Cumulative Mileage</p>
                <h4 className="text-base font-bold text-[#5B8FB0] mt-1">{data.train.total_mileage_km.toLocaleString()} km</h4>
              </div>
              <div className="bg-[#0C1116] p-3 rounded border border-[#28323E]">
                <p className="text-[#9E9E96] uppercase text-[10px]">Lifetime Service Runs</p>
                <h4 className="text-base font-bold text-[#3FA34D] mt-1">{data.train.induction_count} runs</h4>
              </div>
              <div className="bg-[#0C1116] p-3 rounded border border-[#28323E]">
                <p className="text-[#9E9E96] uppercase text-[10px]">Stabling Yard Track</p>
                <h4 className="text-base font-bold text-[#E0A526] mt-1">{data.stabling_bay?.bay_id || 'Yard Track'}</h4>
              </div>
            </div>

            {/* 1. Fitness Certificates */}
            <div className="space-y-2">
              <h4 className="font-display text-xs font-bold uppercase text-[#5B8FB0]">
                Departmental Fitness Certificates
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {data.fitness_certificates.map(cert => (
                  <div key={cert.id} className={`p-2.5 rounded border ${
                    cert.status === 'valid' ? 'bg-[#121E15] border-[#3FA34D]/40' : 'bg-[#1C1214] border-[#C4433A]/40'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#E8E6DF] uppercase">{cert.department.replace('_', ' ')}</span>
                      <span className={`px-1 py-0.2 text-[9px] font-bold rounded ${
                        cert.status === 'valid' ? 'text-[#3FA34D]' : 'text-[#C4433A]'
                      }`}>
                        {cert.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[#9E9E96] text-[10px] mt-1">Valid Until: {cert.valid_until}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Job Cards */}
            <div className="space-y-2">
              <h4 className="font-display text-xs font-bold uppercase text-[#5B8FB0]">
                Work Orders & Job Cards
              </h4>
              {data.job_cards.length === 0 ? (
                <div className="p-3 bg-[#0C1116] rounded border border-[#28323E] text-[#9E9E96]">
                  Zero open work orders. Maintenance clear.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {data.job_cards.map(job => (
                    <div key={job.id} className="bg-[#0C1116] border border-[#28323E] p-2.5 rounded flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#5B8FB0]">{job.job_id}</span>
                          <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                            job.severity === 'critical' ? 'bg-[#1C1214] text-[#C4433A] border border-[#C4433A]/40' : 'bg-[#1C242D] text-[#9E9E96]'
                          }`}>
                            {job.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[#E8E6DF] font-sans text-xs mt-0.5">{job.description}</p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold text-[#E0A526] bg-[#221B10] border border-[#E0A526]/30 rounded">
                        {job.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Branding Contract */}
            {data.branding_contract && (
              <div className="space-y-2">
                <h4 className="font-display text-xs font-bold uppercase text-[#5B8FB0]">
                  Commercial Advertiser Wrap Contract
                </h4>
                <div className="bg-[#0C1116] border border-[#28323E] p-3 rounded flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-[#E8E6DF] font-sans">{data.branding_contract.advertiser}</h5>
                    <p className="text-[#9E9E96]">Contract ID: <span className="text-[#5B8FB0]">{data.branding_contract.contract_id}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#E8E6DF] font-bold">{data.branding_contract.actual_exposure_hours_this_week} / {data.branding_contract.required_exposure_hours_per_week} hrs</p>
                    <p className="text-[#9E9E96] text-[10px]">Weekly quota</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-3 border-t border-[#28323E] bg-[#0C1116] flex justify-end font-mono">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-[#1C242D] hover:bg-[#28323E] text-[#E8E6DF] rounded border border-[#28323E] transition"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
