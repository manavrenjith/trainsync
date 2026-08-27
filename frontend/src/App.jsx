import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DailyPlanView from './components/DailyPlanView';
import ExplanationDrawer from './components/ExplanationDrawer';
import OverrideModal from './components/OverrideModal';
import WhatIfSimulator from './components/WhatIfSimulator';
import FleetAnalytics from './components/FleetAnalytics';
import AuditLogView from './components/AuditLogView';
import TrainDetailModal from './components/TrainDetailModal';
import { API_BASE_URL } from './config';

export default function App() {
  const [activeTab, setActiveTab] = useState('plan');
  const [selectedDate, setSelectedDate] = useState('2026-08-27');
  const [plan, setPlan] = useState([]);
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Modals & Drawers state
  const [selectedTrainForTrace, setSelectedTrainForTrace] = useState(null);
  const [selectedTrainForOverride, setSelectedTrainForOverride] = useState(null);
  const [selectedTrainDetailId, setSelectedTrainDetailId] = useState(null);
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
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
            onSelectTrainForTrace={setSelectedTrainForTrace}
            onSelectTrainForOverride={setSelectedTrainForOverride}
            onSelectTrainDetail={setSelectedTrainDetailId}
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

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 bg-slate-950/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <p>© 2026 Kochi Metro Rail Limited (KMRL) • AI-Driven Fleet Induction & Stabling Optimization</p>
          <p className="font-mono text-cyan-500">SIH PS #80 Solution</p>
        </div>
      </footer>
    </div>
  );
}
