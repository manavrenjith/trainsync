import React from 'react';

export default function Navbar({ activeTab, setActiveTab, selectedDate, setSelectedDate, onRegenerate, isRegenerating }) {
  return (
    <header className="bg-white border-b border-[#E4E7EC] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Subtitle */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-[#2563EB] rounded-full"></span>
              <span className="font-bold text-base text-[#0F172A] tracking-tight">TrainSync</span>
            </div>
            <span className="text-[#E4E7EC]">|</span>
            <span className="text-xs text-[#64748B] font-medium hidden sm:inline">Fleet Induction & Dispatch</span>
          </div>

          {/* Date Picker & Action */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-[#F7F8FA] border border-[#E4E7EC] rounded-md px-3 py-1.5 text-xs text-[#64748B]">
              <span>Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-[#0F172A] font-semibold focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold px-3 py-1.5 rounded-md transition disabled:opacity-50"
            >
              {isRegenerating ? 'Running...' : 'Re-run Engine'}
            </button>
          </div>
        </div>

        {/* Nav Tabs */}
        <nav className="flex space-x-6 border-t border-[#E4E7EC]/60 pt-1">
          {[
            { id: 'plan', label: 'Daily Induction Plan' },
            { id: 'simulator', label: 'What-If Simulator' },
            { id: 'analytics', label: 'Fleet Analytics' },
            { id: 'audit', label: 'Audit Log' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'text-[#0F172A] border-b-2 border-[#2563EB] font-semibold'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
