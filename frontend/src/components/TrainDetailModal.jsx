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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-3xl bg-white border border-[#E4E7EC] rounded-md shadow-lg overflow-hidden max-h-[90vh] flex flex-col justify-between text-xs text-[#0F172A]">
        {/* Header */}
        <div className="p-4 border-b border-[#E4E7EC] flex items-center justify-between bg-[#F7F8FA]">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-mono text-base font-bold text-[#0F172A]">{data?.train?.train_id || trainId}</h3>
              <span className="text-xs text-[#64748B]">({data?.train?.name})</span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">KMRL Fleet Operational Dossier</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#64748B] hover:text-[#0F172A] font-mono text-xs">
            [Close]
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-[#64748B] mt-2">Loading record...</p>
          </div>
        ) : (
          <div className="p-5 overflow-y-auto space-y-5">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#F7F8FA] p-3 rounded border border-[#E4E7EC]">
                <p className="text-[#64748B] text-[11px] font-medium">Cumulative Mileage</p>
                <h4 className="text-base font-bold font-mono text-[#2563EB] mt-1">{data.train.total_mileage_km.toLocaleString()} km</h4>
              </div>
              <div className="bg-[#F7F8FA] p-3 rounded border border-[#E4E7EC]">
                <p className="text-[#64748B] text-[11px] font-medium">Lifetime Service Runs</p>
                <h4 className="text-base font-bold font-mono text-[#16A34A] mt-1">{data.train.induction_count} runs</h4>
              </div>
              <div className="bg-[#F7F8FA] p-3 rounded border border-[#E4E7EC]">
                <p className="text-[#64748B] text-[11px] font-medium">Stabling Yard Track</p>
                <h4 className="text-base font-bold font-mono text-[#D97706] mt-1">{data.stabling_bay?.bay_id || 'Yard Track'}</h4>
              </div>
            </div>

            {/* 1. Fitness Certificates */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#0F172A] uppercase">
                Departmental Fitness Certificates
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {data.fitness_certificates.map(cert => (
                  <div key={cert.id} className={`p-2.5 rounded border ${
                    cert.status === 'valid' ? 'bg-[#F7F8FA] border-[#16A34A]/30' : 'bg-[#F7F8FA] border-[#DC2626]/30'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[#0F172A] uppercase">{cert.department.replace('_', ' ')}</span>
                      <span className={`text-[10px] font-bold ${
                        cert.status === 'valid' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                      }`}>
                        {cert.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[#64748B] text-[10px] font-mono mt-1">Valid Until: {cert.valid_until}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Job Cards */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#0F172A] uppercase">
                Work Orders & Job Cards
              </h4>
              {data.job_cards.length === 0 ? (
                <div className="p-3 bg-[#F7F8FA] rounded border border-[#E4E7EC] text-[#64748B]">
                  Zero open work orders. Maintenance clear.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {data.job_cards.map(job => (
                    <div key={job.id} className="bg-[#F7F8FA] border border-[#E4E7EC] p-2.5 rounded flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-semibold text-[#2563EB]">{job.job_id}</span>
                          <span className={`px-1.5 py-0.2 text-[9px] font-semibold rounded ${
                            job.severity === 'critical' ? 'bg-[#DC2626]/10 text-[#DC2626]' : 'bg-[#E4E7EC] text-[#64748B]'
                          }`}>
                            {job.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[#0F172A] text-xs mt-0.5">{job.description}</p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-semibold text-[#D97706] bg-white border border-[#E4E7EC] rounded">
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
                <h4 className="text-xs font-semibold text-[#0F172A] uppercase">
                  Commercial Advertiser Wrap Contract
                </h4>
                <div className="bg-[#F7F8FA] border border-[#E4E7EC] p-3 rounded flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-[#0F172A]">{data.branding_contract.advertiser}</h5>
                    <p className="text-[#64748B]">Contract ID: <span className="font-mono text-[#2563EB]">{data.branding_contract.contract_id}</span></p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="text-[#0F172A] font-semibold">{data.branding_contract.actual_exposure_hours_this_week} / {data.branding_contract.required_exposure_hours_per_week} hrs</p>
                    <p className="text-[#64748B] text-[10px]">Weekly quota</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-3 border-t border-[#E4E7EC] bg-[#F7F8FA] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-white hover:bg-[#E4E7EC] text-[#0F172A] rounded border border-[#E4E7EC] transition"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
