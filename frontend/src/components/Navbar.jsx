import React from 'react';

export default function Navbar({ activeTab, setActiveTab, selectedDate, setSelectedDate, onRegenerate, isRegenerating }) {
  return (
    <header className="bg-[#141B22] border-b border-[#28323E] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Operational Dispatch Header */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-[#5B8FB0] rounded-sm"></span>
              <h1 className="font-display text-xl font-bold text-[#E8E6DF] tracking-wider uppercase">
                TrainSync
              </h1>
            </div>

            <div className="h-4 w-px bg-[#28323E]"></div>
            <p className="text-xs text-[#9E9E96] font-mono hidden sm:block">
              Muttom Depot • Dispatch Control & Fleet Induction
            </p>
          </div>

          {/* Date Selector & Operational Actions */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-[#0C1116] border border-[#28323E] rounded px-3 py-1.5 text-xs font-mono">
              <span className="text-[#9E9E96]">Target Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-[#E8E6DF] font-bold focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="bg-[#1C242D] hover:bg-[#28323E] text-[#E8E6DF] text-xs font-mono font-bold px-3 py-1.5 rounded border border-[#28323E] transition disabled:opacity-50"
            >
              {isRegenerating ? 'RUNNING OPTIMIZER...' : 'RE-RUN ENGINE'}
            </button>
          </div>
        </div>

        {/* Dispatch Navigation Bar */}
        <nav className="flex space-x-1 border-t border-[#28323E]/60 pt-1">
          {[
            { id: 'plan', label: 'Daily Induction Plan' },
            { id: 'simulator', label: 'What-If Simulator' },
            { id: 'analytics', label: 'Fleet Telemetry & SLAs' },
            { id: 'audit', label: 'Audit Log & Overrides' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-mono font-semibold rounded-t transition-all ${
                  isActive
                    ? 'bg-[#0C1116] text-[#5B8FB0] border-t-2 border-[#5B8FB0]'
                    : 'text-[#9E9E96] hover:text-[#E8E6DF] hover:bg-[#0C1116]/40'
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
