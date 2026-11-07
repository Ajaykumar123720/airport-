import React, { useState } from 'react';
import { AirportProvider, useAirport } from './context/AirportContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { EmergencyBanner } from './components/EmergencyBanner';
import { Dashboard } from './components/Dashboard';
import { FlightManagement } from './components/FlightManagement';
import { RunwayManagement } from './components/RunwayManagement';
import { SchedulingQueue } from './components/SchedulingQueue';
import { GanttChart } from './components/GanttChart';
import { EmergencyManagement } from './components/EmergencyManagement';
import { SafetyManagement } from './components/SafetyManagement';
import { AnalyticsReports } from './components/AnalyticsReports';
import { SystemArchitecture } from './components/SystemArchitecture';
import { Settings } from './components/Settings';
import { AddFlightModal } from './components/AddFlightModal';

const MainAppContent: React.FC = () => {
  const { activeTab } = useAirport();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans atc-grid-bg">
      {/* Top Navigation & ATC Command Bar */}
      <Header onOpenAddModal={() => setIsAddModalOpen(true)} />

      {/* Prominent Emergency Alert Banner */}
      <EmergencyBanner />

      {/* Workspace Area: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Active Module Viewport */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'flights' && (
            <FlightManagement onOpenAddModal={() => setIsAddModalOpen(true)} />
          )}
          {activeTab === 'runways' && <RunwayManagement />}
          {activeTab === 'queue' && <SchedulingQueue />}
          {activeTab === 'gantt' && <GanttChart />}
          {activeTab === 'emergency' && <EmergencyManagement />}
          {activeTab === 'safety' && <SafetyManagement />}
          {activeTab === 'analytics' && <AnalyticsReports />}
          {activeTab === 'architecture' && <SystemArchitecture />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* Global Add Flight Modal */}
      <AddFlightModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AirportProvider>
      <MainAppContent />
    </AirportProvider>
  );
}
