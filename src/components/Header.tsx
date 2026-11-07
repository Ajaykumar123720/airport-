import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  AlertOctagon,
  Volume2,
  VolumeX,
  Zap,
  Clock,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useAirport } from '../context/AirportContext';

interface HeaderProps {
  onOpenAddModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddModal }) => {
  const {
    formattedSimTime,
    isSimulating,
    toggleSimulation,
    simSpeed,
    setSimSpeed,
    resetSimulation,
    runSchedulerManually,
    conflicts,
    activeEmergencyFlight,
    quickGenerateFlight,
    audioAlertsEnabled,
    setAudioAlertsEnabled,
    setActiveTab
  } = useAirport();

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-6 flex items-center justify-between gap-4 sticky top-0 z-40 select-none">
      {/* Brand & Airspace Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold text-base">
          ATC
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm lg:text-base font-bold text-white tracking-tight">
              AIRPORT RUNWAY SCHEDULER
            </h1>
            <span className="hidden sm:inline-block text-[11px] text-cyan-400 font-mono tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">
              SMART ATC
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono hidden md:block">
            CLASS B TERMINAL AIRSPACE · 4 RUNWAYS ACTIVE
          </p>
        </div>
      </div>

      {/* Center Zone: Simulation Controls & Zulu Clock */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Zulu Time Clock */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 font-mono text-xs sm:text-sm shadow-inner">
          <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="tabular-nums font-semibold tracking-wider">{formattedSimTime}</span>
          <span className="text-[10px] text-slate-500 uppercase">ZULU</span>
        </div>

        {/* Start / Pause Simulation */}
        <button
          onClick={toggleSimulation}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm ${
            isSimulating
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/30'
          }`}
          title={isSimulating ? 'Pause Airport Simulation' : 'Start Airport Simulation'}
        >
          {isSimulating ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">START SIMULATION</span>
            </>
          )}
        </button>

        {/* Speed multiplier selector */}
        <div className="hidden lg:flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
          {[1, 2, 5].map(speed => (
            <button
              key={speed}
              onClick={() => setSimSpeed(speed)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                simSpeed === speed
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Reset Simulation */}
        <button
          onClick={resetSimulation}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors border border-slate-800"
          title="Reset Simulation to Initial 16 Flights"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Manual Trigger Scheduler */}
        <button
          onClick={runSchedulerManually}
          className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
          title="Recalculate Priority Queue and Reassign Slots"
        >
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span>Recalculate</span>
        </button>
      </div>

      {/* Right Zone: Conflict Status, Audio, Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Conflict / Safety Status Pill */}
        <button
          onClick={() => setActiveTab('safety')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-lg border transition-all ${
            conflicts.length > 0
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
              : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 hover:bg-emerald-950/60'
          }`}
          title={conflicts.length > 0 ? `${conflicts.length} Runway Separation Conflicts Detected` : 'All Runways Separation Clear'}
        >
          {conflicts.length > 0 ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
              <span className="hidden sm:inline font-bold">{conflicts.length} CONFLICTS</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">SEPARATION SAFE</span>
            </>
          )}
        </button>

        {/* Emergency quick alert button */}
        {activeEmergencyFlight ? (
          <button
            onClick={() => setActiveTab('emergency')}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-lg animate-pulse shadow-lg shadow-red-600/30"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EMERGENCY ACTIVE</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('emergency')}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg border border-rose-900/40 transition-colors"
            title="Simulate Aircraft Emergency"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Simulate Emergency</span>
          </button>
        )}

        {/* Quick Add Inbound/Outbound Flight */}
        <button
          onClick={() => quickGenerateFlight()}
          className="hidden md:flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-950/50 hover:bg-cyan-900/60 rounded-lg border border-cyan-800/60 transition-colors"
          title="Simulate Random Inbound or Outbound Aircraft"
        >
          <Zap className="w-3 h-3 text-cyan-400" />
          <span>+ Spawn Flight</span>
        </button>

        {/* Add Flight Modal button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Flight</span>
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
          className={`p-1.5 rounded-lg border transition-colors ${
            audioAlertsEnabled
              ? 'text-cyan-400 border-cyan-900/50 hover:bg-cyan-950/40'
              : 'text-slate-500 border-slate-800 hover:bg-slate-800'
          }`}
          title={audioAlertsEnabled ? 'Audio Alerts Enabled' : 'Audio Alerts Muted'}
        >
          {audioAlertsEnabled ? (
            <Volume2 className="w-3.5 h-3.5" />
          ) : (
            <VolumeX className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </header>
  );
};
