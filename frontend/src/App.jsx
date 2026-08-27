import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DailyPlanView from './components/DailyPlanView';
import ExplanationDrawer from './components/ExplanationDrawer';
import OverrideModal from './components/OverrideModal';
import WhatIfSimulator from './components/WhatIfSimulator';
import FleetAnalytics from './components/FleetAnalytics';
import AuditLogView from './components/AuditLogView';
import TrainDetailModal from './components/TrainDetailModal';
import ShuntSequenceModal from './components/ShuntSequenceModal';
import { API_BASE_URL } from './config';

export default function App() {
  const [activeTab, setActiveTab] = useState('plan');
  const [selectedDate, setSelectedDate] = useState('2026-08-27');
  const [plan, setPlan] = useState([]);
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [lastRunTimestamp, setLastRunTimestamp] = useState('2026-08-27 09:38:00');

  // Modals & Drawers state
  const [selectedTrainForTrace, setSelectedTrainForTrace] = useState(null);
  const [selectedTrainForOverride, setSelectedTrainForOverride] = useState(null);
  const [selectedTrainDetailId, setSelectedTrainDetailId] = useState(null);
  const [selectedTrainForShunt, setSelectedTrainForShunt] = useState(null);
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  const handleOpenShuntPlan = (trainId, reason) => {
    setSelectedTrainForTrace(null);
    setSelectedTrainForOverride(null);
    setSelectedTrainDetailId(null);
    setSelectedTrainForShunt({ trainId, reason });
  };

  const updateTimestamp = () => {
    const now = new Date();
    const formatted = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');
    setLastRunTimestamp(formatted);
  };

  const fetchPlan = async (dateStr) => {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/plan/${dateStr}`),
        fetch(`${API_BASE_URL}/api/trains`)
      ]);
      const pData = await pRes.json();
      const tData = await tRes.json();
      setPlan(pData);
      setTrains(tData);
      updateTimestamp();
    } catch (err) {
      console.error("Failed to fetch plan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan(selectedDate);
  }, [selectedDate]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/plan/${selectedDate}/generate`, { method: 'POST' });
      const data = await res.json();
      setPlan(data);
      updateTimestamp();
    } catch (err) {
      console.error("Regeneration failed:", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleOverrideSubmit = async (overridePayload) => {
    setIsSubmittingOverride(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/plan/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overridePayload)
      });
      if (res.ok) {
        setSelectedTrainForOverride(null);
        fetchPlan(selectedDate);
      }
    } catch (err) {
      console.error("Override failed:", err);
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0F172A] flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onRegenerate={handleRegenerate}
        isRegenerating={isRegenerating}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'plan' && (
          <DailyPlanView
            plan={plan}
            loading={loading}
            onSelectTrainForTrace={(train) => {
              setSelectedTrainForShunt(null);
              setSelectedTrainForTrace(train);
            }}
            onSelectTrainForOverride={(train) => {
              setSelectedTrainForShunt(null);
              setSelectedTrainForOverride(train);
            }}
            onSelectTrainDetail={(trainId) => {
              setSelectedTrainForShunt(null);
              setSelectedTrainDetailId(trainId);
            }}
            onOpenShuntPlan={handleOpenShuntPlan}
          />
        )}

        {activeTab === 'simulator' && (
          <WhatIfSimulator
            selectedDate={selectedDate}
            trains={trains}
          />
        )}

        {activeTab === 'analytics' && (
          <FleetAnalytics />
        )}

        {activeTab === 'audit' && (
          <AuditLogView />
        )}
      </main>

      {/* Modals & Drawers */}
      <ExplanationDrawer
        decision={selectedTrainForTrace}
        onClose={() => setSelectedTrainForTrace(null)}
        onOpenShuntPlan={handleOpenShuntPlan}
      />

      <OverrideModal
        decision={selectedTrainForOverride}
        onClose={() => setSelectedTrainForOverride(null)}
        onSubmitOverride={handleOverrideSubmit}
        isSubmitting={isSubmittingOverride}
      />

      <TrainDetailModal
        trainId={selectedTrainDetailId}
        onClose={() => setSelectedTrainDetailId(null)}
      />

      {selectedTrainForShunt && (
        <ShuntSequenceModal
          blockedTrainId={selectedTrainForShunt.trainId}
          blockedReason={selectedTrainForShunt.reason}
          onClose={() => setSelectedTrainForShunt(null)}
        />
      )}

      {/* Minimal Status Footer */}
      <footer className="border-t border-[#E4E7EC] py-4 bg-white text-xs text-[#64748B] font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span>TrainSync — Fleet Induction Engine · v1.0</span>
          <span>Engine last run: {lastRunTimestamp}</span>
        </div>
      </footer>
    </div>
  );
}
