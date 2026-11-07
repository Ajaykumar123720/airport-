import React from 'react';
import { AlertOctagon, ArrowRight, X, ShieldAlert } from 'lucide-react';
import { useAirport } from '../context/AirportContext';

export const EmergencyBanner: React.FC = () => {
  const {
    activeEmergencyFlight,
    emergencyBannerDismissed,
    dismissEmergencyBanner,
    setActiveTab,
    resolveEmergency
  } = useAirport();

  if (!activeEmergencyFlight || emergencyBannerDismissed) {
    return null;
  }

  const rwyName = activeEmergencyFlight.assignedRunwayId
    ? activeEmergencyFlight.assignedRunwayId.replace('RWY-', '')
    : '09L/27R';

  return (
    <div className="bg-gradient-to-r from-red-950 via-red-900 to-rose-950 border-b border-red-700/80 px-4 py-2.5 text-white shadow-xl relative z-30 animate-in fade-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0 shadow-lg shadow-red-600/50 animate-pulse">
            <AlertOctagon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/30 border border-red-400/40 text-red-100">
                MAYDAY / PRIORITY P1 ACTIVE
              </span>
              <span className="font-bold text-sm text-white">
                {activeEmergencyFlight.flightNumber} ({activeEmergencyFlight.aircraftName})
              </span>
              <span className="text-xs text-red-200">
                · Fuel: <strong className="text-yellow-300 font-mono">{activeEmergencyFlight.fuelPercent}%</strong>
              </span>
            </div>
            <p className="text-xs text-red-200/90 mt-0.5">
              {activeEmergencyFlight.emergencyDetails || 'Aircraft in distress. Emergency preemption has allocated immediate slot on Runway ' + rwyName + '.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            onClick={() => setActiveTab('emergency')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Emergency Console</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            onClick={() => resolveEmergency(activeEmergencyFlight.id)}
            className="px-2.5 py-1.5 bg-slate-900/60 hover:bg-slate-900 text-slate-200 border border-red-700/60 rounded-lg text-xs font-medium transition-colors"
            title="Mark emergency condition resolved"
          >
            Resolve
          </button>

          <button
            onClick={dismissEmergencyBanner}
            className="p-1 text-red-300 hover:text-white rounded transition-colors"
            title="Hide banner (emergency remains active)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
