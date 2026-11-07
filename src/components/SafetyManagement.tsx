import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Sliders,
  CheckCircle2,
  Clock,
  RotateCcw,
  Info
} from 'lucide-react';
import { useAirport } from '../context/AirportContext';
import { SeparationRule, AircraftWeightCategory } from '../types';
import { INITIAL_SEPARATION_RULES } from '../utils/sampleData';
import { formatMinutesToTime } from '../utils/scheduler';

export const SafetyManagement: React.FC = () => {
  const {
    separationRules,
    updateSeparationRules,
    conflicts,
    autoResolveConflicts,
    flights,
    runways
  } = useAirport();

  // Local editing copy of separation rules
  const [localRules, setLocalRules] = useState<SeparationRule[]>(separationRules);
  const [isSaved, setIsSaved] = useState(false);

  const categories: AircraftWeightCategory[] = ['Heavy', 'Medium', 'Light'];

  const getRule = (leader: AircraftWeightCategory, follower: AircraftWeightCategory): SeparationRule => {
    return (
      localRules.find(r => r.leader === leader && r.follower === follower) || {
        leader,
        follower,
        separationMinutes: 2.0,
        separationNm: 4.0
      }
    );
  };

  const handleMinutesChange = (leader: AircraftWeightCategory, follower: AircraftWeightCategory, value: number) => {
    const updated = localRules.map(r => {
      if (r.leader === leader && r.follower === follower) {
        return { ...r, separationMinutes: Math.max(0.5, value) };
      }
      return r;
    });
    setLocalRules(updated);
    setIsSaved(false);
  };

  const handleNmChange = (leader: AircraftWeightCategory, follower: AircraftWeightCategory, value: number) => {
    const updated = localRules.map(r => {
      if (r.leader === leader && r.follower === follower) {
        return { ...r, separationNm: Math.max(1.0, value) };
      }
      return r;
    });
    setLocalRules(updated);
    setIsSaved(false);
  };

  const handleSaveRules = () => {
    updateSeparationRules(localRules);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetDefaults = () => {
    setLocalRules(INITIAL_SEPARATION_RULES);
    updateSeparationRules(INITIAL_SEPARATION_RULES);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                ICAO WAKE TURBULENCE & RUNWAY SEPARATION ENGINE
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              SAFETY MONITOR · CONFLICT DETECTION · MINIMUM LONGITUDINAL SEPARATION STANDARDS
            </p>
          </div>

          <div className="flex items-center gap-2">
            {conflicts.length > 0 ? (
              <button
                onClick={autoResolveConflicts}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs rounded-lg shadow-lg shadow-rose-600/30 transition-all animate-bounce"
              >
                <Zap className="w-4 h-4" />
                <span>Auto-Resolve All ({conflicts.length}) Conflicts</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-mono text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Runway Separation Violations</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-Time Conflict Detection Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${conflicts.length > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
            <h3 className="text-sm font-bold text-white uppercase">
              LIVE CONFLICT AUDIT MONITOR ({conflicts.length} ISSUES DETECTED)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Real-time pairwise schedule cross-verification
          </span>
        </div>

        {conflicts.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-800 rounded-lg">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="font-bold text-white text-sm">ALL RUNWAY SCHEDULES NOMINAL</p>
            <p className="text-slate-400 text-xs mt-1">
              Every successive arrival and departure maintains minimum wake turbulence time buffers and surface occupancy clearance.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conflicts.map(conflict => (
              <div
                key={conflict.id}
                className="p-3.5 rounded-lg bg-red-950/30 border border-red-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">
                      {conflict.severity.toUpperCase()} CONFLICT
                    </span>
                    <span className="text-white font-bold">
                      Runway {conflict.runwayName}: {conflict.flightAName} vs {conflict.flightBName}
                    </span>
                  </div>
                  <p className="text-red-200 text-xs">
                    {conflict.description}
                  </p>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Slot A: @{formatMinutesToTime(conflict.scheduledTimeA)} · Slot B: @{formatMinutesToTime(conflict.scheduledTimeB)} · Gap: {conflict.actualGapMinutes}m (Req: {conflict.requiredGapMinutes}m)
                  </div>
                </div>

                <button
                  onClick={autoResolveConflicts}
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-xs shrink-0"
                >
                  Shift Slot (+{Math.max(1, conflict.requiredGapMinutes - conflict.actualGapMinutes)}m)
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configurable Wake Turbulence Separation Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg font-mono text-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 mb-4 gap-2">
          <div>
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              ICAO WAKE TURBULENCE MATRIX (LEADER VS FOLLOWER)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Prototype simulation settings. Values configure minimum time buffer (minutes) and distance (NM).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Defaults</span>
            </button>
            <button
              onClick={handleSaveRules}
              className="px-4 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-colors shadow-sm"
            >
              Apply & Re-validate
            </button>
          </div>
        </div>

        {isSaved && (
          <div className="p-2.5 mb-4 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-200 flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Separation matrix updated successfully. Runway schedules re-checked.</span>
          </div>
        )}

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                <th className="py-3 px-4 text-left">
                  Leader (Ahead) ↓ / Follower (Behind) →
                </th>
                {categories.map(cat => (
                  <th key={cat} className="py-3 px-4 font-bold text-cyan-400">
                    {cat}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {categories.map(leader => (
                <tr key={leader} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-left font-bold text-white bg-slate-950/30">
                    {leader}
                    <span className="text-[10px] text-slate-400 block font-normal">
                      {leader === 'Heavy' ? '>136t' : leader === 'Medium' ? '7t - 136t' : '<7t'}
                    </span>
                  </td>

                  {categories.map(follower => {
                    const rule = getRule(leader, follower);
                    const isHighRisk = leader === 'Heavy' && follower === 'Light';

                    return (
                      <td
                        key={follower}
                        className={`py-3 px-4 ${
                          isHighRisk ? 'bg-red-950/20' : ''
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              max="10"
                              value={rule.separationMinutes}
                              onChange={e =>
                                handleMinutesChange(leader, follower, parseFloat(e.target.value) || 1)
                              }
                              className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-center text-white focus:outline-none focus:border-cyan-500 font-bold"
                            />
                            <span className="text-slate-400 text-[10px]">min</span>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <input
                              type="number"
                              step="0.5"
                              min="1"
                              max="15"
                              value={rule.separationNm}
                              onChange={e =>
                                handleNmChange(leader, follower, parseFloat(e.target.value) || 1)
                              }
                              className="w-12 bg-slate-950/80 border border-slate-800 rounded px-1 py-0.5 text-center text-slate-300 focus:outline-none focus:border-cyan-500 text-[10px]"
                            />
                            <span>NM</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Regulatory disclaimer */}
        <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            Notice: Values configured above represent academic simulation parameters based on ICAO Doc 4444 PANS-ATM (Procedures for Air Navigation Services - Air Traffic Management) and FAA Order 7110.65. Any live operational deployment requires formal regulatory audit and validation.
          </p>
        </div>
      </div>
    </div>
  );
};
