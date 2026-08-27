import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { API_BASE_URL } from '../config';

export default function FleetAnalytics() {
  const [mileageData, setMileageData] = useState(null);
  const [brandingData, setBrandingData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [mRes, bRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/analytics/mileage`),
          fetch(`${API_BASE_URL}/api/analytics/branding`)
        ]);
        const mData = await mRes.json();
        const bData = await bRes.json();
        setMileageData(mData);
        setBrandingData(bData);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-2">
        <div className="w-8 h-8 border-2 border-[#5B8FB0] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-[#9E9E96]">Loading operational telemetry data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Mileage Balance Chart Panel */}
      <div className="depot-panel p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#28323E] pb-3">
          <div>
            <h2 className="font-display text-base font-bold text-[#E8E6DF] uppercase tracking-wider">
              Fleet Cumulative Mileage Balancing
            </h2>
            <p className="text-xs text-[#9E9E96] font-mono mt-0.5">
              Target baseline: Equalized wear across bogies, brake pads, and HVAC compressors
            </p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mileageData?.fleet_mileage || []} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#28323E" />
              <XAxis dataKey="train_id" stroke="#9E9E96" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} angle={-45} textAnchor="end" />
              <YAxis stroke="#9E9E96" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} domain={[0, 'dataMax + 2000']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#141B22', borderColor: '#28323E', borderRadius: '4px', fontSize: '12px', fontFamily: 'IBM Plex Mono' }}
                itemStyle={{ color: '#5B8FB0' }}
              />
              <Bar dataKey="total_mileage_km" fill="#5B8FB0" radius={[2, 2, 0, 0]} name="Total Km Run" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 30-Day Trend */}
        <div className="pt-4 border-t border-[#28323E] space-y-2 font-mono">
          <h3 className="font-display text-xs font-bold uppercase text-[#9E9E96]">
            30-Day Fleet Average Km Run per Day
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mileageData?.daily_trend || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#28323E" />
                <XAxis dataKey="date" stroke="#9E9E96" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
                <YAxis stroke="#9E9E96" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#141B22', borderColor: '#28323E', borderRadius: '4px', fontSize: '12px', fontFamily: 'IBM Plex Mono' }}
                />
                <Line type="monotone" dataKey="avg_km_run" stroke="#3FA34D" strokeWidth={2} name="Fleet Avg Km/day" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Commercial Wrap SLA Panel */}
      <div className="depot-panel p-5 space-y-4">
        <div className="border-b border-[#28323E] pb-3">
          <h2 className="font-display text-base font-bold text-[#E8E6DF] uppercase tracking-wider">
            Commercial Advertiser Wrap SLA Compliance
          </h2>
          <p className="text-xs text-[#9E9E96] font-mono mt-0.5">
            Weekly exposure hours achieved vs. contractual SLA quota per trainset wrap
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {brandingData.map(c => (
            <div key={c.contract_id} className="bg-[#0C1116] border border-[#28323E] rounded p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#E8E6DF] font-sans">{c.advertiser}</h4>
                  <p className="text-[#9E9E96] text-[11px]">Contract: <span className="text-[#5B8FB0]">{c.contract_id}</span> ({c.train_id})</p>
                </div>
                <span className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                  c.sla_compliance_pct >= 100
                    ? 'bg-[#121E15] text-[#3FA34D] border border-[#3FA34D]/40'
                    : c.sla_compliance_pct >= 75
                    ? 'bg-[#221B10] text-[#E0A526] border border-[#E0A526]/40'
                    : 'bg-[#1C1214] text-[#C4433A] border border-[#C4433A]/40'
                }`}>
                  {c.sla_compliance_pct}% SLA
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[#9E9E96] text-[11px]">
                  <span>Exposure Hours</span>
                  <span className="font-bold text-[#E8E6DF]">{c.actual_exposure_hours_this_week} / {c.required_exposure_hours_per_week} hrs</span>
                </div>
                <div className="w-full bg-[#141B22] rounded-sm h-1.5 overflow-hidden border border-[#28323E]">
                  <div
                    className={`h-full ${
                      c.sla_compliance_pct >= 100 ? 'bg-[#3FA34D]' : c.sla_compliance_pct >= 75 ? 'bg-[#E0A526]' : 'bg-[#C4433A]'
                    }`}
                    style={{ width: `${Math.min(100, c.sla_compliance_pct)}%` }}
                  ></div>
                </div>
              </div>

              {c.shortfall_hours > 0 && (
                <div className="pt-2 border-t border-[#28323E] flex items-center justify-between text-[11px] text-[#C4433A]">
                  <span>Shortfall: {c.shortfall_hours} hrs</span>
                  <span>Est Penalty: ₹{(c.penalty_incurred).toLocaleString()}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
