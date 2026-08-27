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
        <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-[#64748B]">Loading fleet telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-xs text-[#0F172A]">
      {/* Mileage Balance Panel */}
      <div className="bg-white border border-[#E4E7EC] rounded-md p-5 space-y-4">
        <div className="border-b border-[#E4E7EC] pb-3">
          <h2 className="text-sm font-semibold text-[#0F172A]">
            Fleet Cumulative Mileage Balancing
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Equalized cumulative distance (km) across 25 trainsets to balance wear on bogies and brake pads.
          </p>
        </div>

        {/* Bar Chart */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mileageData?.fleet_mileage || []} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#E4E7EC" />
              <XAxis dataKey="train_id" stroke="#64748B" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} angle={-45} textAnchor="end" />
              <YAxis stroke="#64748B" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} domain={[0, 'dataMax + 2000']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E4E7EC', borderRadius: '4px', fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                itemStyle={{ color: '#2563EB' }}
              />
              <Bar dataKey="total_mileage_km" fill="#2563EB" radius={[2, 2, 0, 0]} name="Total Km Run" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 30-Day Trend */}
        <div className="pt-4 border-t border-[#E4E7EC] space-y-2">
          <h3 className="text-xs font-semibold text-[#0F172A]">
            30-Day Fleet Average Daily Km Trend
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mileageData?.daily_trend || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#E4E7EC" />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E4E7EC', borderRadius: '4px', fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                />
                <Line type="monotone" dataKey="avg_km_run" stroke="#16A34A" strokeWidth={2} name="Fleet Avg Km/day" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Commercial Branding Panel */}
      <div className="bg-white border border-[#E4E7EC] rounded-md p-5 space-y-4">
        <div className="border-b border-[#E4E7EC] pb-3">
          <h2 className="text-sm font-semibold text-[#0F172A]">
            Commercial Advertiser Branding SLA Compliance
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Weekly exposure hours achieved vs. contractual SLA quota per trainset wrap.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brandingData.map(c => (
            <div key={c.contract_id} className="bg-[#F7F8FA] border border-[#E4E7EC] rounded p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-[#0F172A]">{c.advertiser}</h4>
                  <p className="text-[#64748B] text-[11px]">Contract: <span className="font-mono text-[#2563EB]">{c.contract_id}</span> ({c.train_id})</p>
                </div>
                <span className={`px-2 py-0.5 text-[11px] font-semibold font-mono rounded ${
                  c.sla_compliance_pct >= 100
                    ? 'text-[#16A34A] bg-[#16A34A]/10'
                    : c.sla_compliance_pct >= 75
                    ? 'text-[#D97706] bg-[#D97706]/10'
                    : 'text-[#DC2626] bg-[#DC2626]/10'
                }`}>
                  {c.sla_compliance_pct}% SLA
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[#64748B] text-[11px]">
                  <span>Exposure Hours</span>
                  <span className="font-mono font-medium text-[#0F172A]">{c.actual_exposure_hours_this_week} / {c.required_exposure_hours_per_week} hrs</span>
                </div>
                <div className="w-full bg-white rounded-full h-1.5 overflow-hidden border border-[#E4E7EC]">
                  <div
                    className={`h-full ${
                      c.sla_compliance_pct >= 100 ? 'bg-[#16A34A]' : c.sla_compliance_pct >= 75 ? 'bg-[#D97706]' : 'bg-[#DC2626]'
                    }`}
                    style={{ width: `${Math.min(100, c.sla_compliance_pct)}%` }}
                  ></div>
                </div>
              </div>

              {c.shortfall_hours > 0 && (
                <div className="pt-2 border-t border-[#E4E7EC] flex items-center justify-between text-[11px] text-[#DC2626]">
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
