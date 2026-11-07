import React, { useState } from 'react';
import {
  AlertOctagon,
  Flame,
  Activity,
  HeartPulse,
  Radio,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Plane,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { useAirport } from '../context/AirportContext';
import { EmergencyType, Flight } from '../types';
import { formatMinutesToTime } from '../utils/scheduler';

export const EmergencyManagement: React.FC = () => {
  const {
    flights,
    triggerEmergency,
    resolveEmergency,
    divertFlight,
    runways,
    activityLogs,
    currentSimTimeMinutes,
    setActiveTab
  } = useAirport();

  // Selected aircraft for manual emergency trigger
  const [selectedFlightId, setSelectedFlightId] = useState<string>('');
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('low_fuel');
  const [customDetails, setCustomDetails] = useState<string>('');

  // Active emergency aircraft list
  const activeEmergencies = flights.filter(f => f.priority === 'P1' && f.status !== 'Completed' && f.status !== 'Diverted');

  // Candidate non-emergency flights that can be triggered
  const normalFlights = flights.filter(f => f.priority !== 'P1' && f.status !== 'Completed' && f.status !== 'Diverted');

  const handleTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlightId) return;

    triggerEmergency(selectedFlightId, emergencyType, customDetails);
    setCustomDetails('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                EMERGENCY MANAGEMENT & PREEMPTION COMMAND CONSOLE
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              AUTOMATIC P1 PREEMPTION PROTOCOL · HEAP RESCORING · RUNWAY CRITICAL ALLOCATION
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold ${
              activeEmergencies.length > 0
                ? 'bg-red-950 text-red-200 border-red-700 animate-pulse'
                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
            }`}>
              {activeEmergencies.length > 0
                ? `${activeEmergencies.length} ACTIVE EMERGENCIES`
                : 'AIRSPACE CONDITION NOMINAL'}
            </span>
          </div>
        </div>
      </div>

      {/* 2 Column Layout: Trigger Console (Left) + Active Emergencies & Preemption Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Simulate Emergency Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 font-mono text-xs">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-400" />
              SIMULATE IN-FLIGHT EMERGENCY INCIDENT
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Test dynamic heap preemption by declaring an in-flight crisis.
            </p>
          </div>

          <form onSubmit={handleTrigger} className="space-y-4">
            {/* Select Flight */}
            <div>
              <label className="text-slate-400 block mb-1">Select Candidate Aircraft:</label>
              <select
                value={selectedFlightId}
                onChange={e => setSelectedFlightId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500 font-bold"
                required
              >
                <option value="">-- Choose an active flight in sector --</option>
                {normalFlights.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.flightNumber} - {f.aircraftName} ({f.operation}, Fuel: {f.fuelPercent}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Emergency Type Selector */}
            <div>
              <label className="text-slate-400 block mb-2">Emergency Category:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    type: 'low_fuel' as const,
                    label: 'Low Fuel (<15%)',
                    icon: Flame,
                    desc: 'Mayday Fuel reserve breach'
                  },
                  {
                    type: 'engine_failure' as const,
                    label: 'Engine Problem',
                    icon: AlertOctagon,
                    desc: 'Turbine stall / shutdown'
                  },
                  {
                    type: 'medical' as const,
                    label: 'Medical Crisis',
                    icon: HeartPulse,
                    desc: 'Critical onboard cardiac'
                  },
                  {
                    type: 'mayday' as const,
                    label: 'Mayday (Hydraulic)',
                    icon: ShieldAlert,
                    desc: 'Flight control degradation'
                  }
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = emergencyType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setEmergencyType(item.type)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-red-950/80 border-red-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-red-400' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight">
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="text-slate-400 block mb-1">Incident Report / Pilot Transmission:</label>
              <input
                type="text"
                value={customDetails}
                onChange={e => setCustomDetails(e.target.value)}
                placeholder="e.g. MAYDAY MAYDAY - Engine 2 flameout at FL120"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedFlightId}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-lg shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>DECLARE P1 EMERGENCY PREEMPTION</span>
            </button>
          </form>

          {/* How Preemption Works Explainer */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <strong className="text-cyan-400 block">AUTOMATIC REALLOCATION ALGORITHM:</strong>
            <p>1. Detects emergency & sets Priority = P1 (base boost +600).</p>
            <p>2. Re-computes Max-Heap priority queue in O(log N) time.</p>
            <p>3. Matches best category runway (longest CAT III 4000m runway 09L/27R).</p>
            <p>4. Shifts downstream lower-priority flights while enforcing wake turbulence rules.</p>
            <p>5. Locks flight on concrete during rollout; never cancels touchdown.</p>
          </div>
        </div>

        {/* Right Column: Active Emergency Incidents & Step-By-Step Reassignment (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg font-mono text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              ACTIVE EMERGENCY FLIGHTS & CONTROLLER DIRECTIVES ({activeEmergencies.length})
            </h3>

            {activeEmergencies.length === 0 ? (
              <div className="text-center py-12 text-slate-400 border border-dashed border-slate-800 rounded-lg">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-bold text-slate-300">NO ACTIVE DISTRESS SIGNALS</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  All flights operating within standard separation parameters. Select an aircraft on the left to trigger a simulation test.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeEmergencies.map(flight => (
                  <div
                    key={flight.id}
                    className="p-4 rounded-xl bg-red-950/30 border border-red-700/80 shadow-md space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-red-800/60">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-white">{flight.flightNumber}</span>
                          <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px] animate-pulse">
                            MAYDAY / P1
                          </span>
                        </div>
                        <div className="text-[11px] text-red-200">
                          {flight.airline} · {flight.aircraftName} ({flight.aircraftType})
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-red-300">Fuel Reserve:</div>
                        <div className="text-base font-bold text-yellow-300 tabular-nums">
                          {flight.fuelPercent}%
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-red-200/90 leading-relaxed">
                      <strong>Incident Description:</strong> {flight.emergencyDetails || 'Aircraft in distress - immediate runway priority required.'}
                    </p>

                    {/* Preemption Details Box */}
                    <div className="p-3 bg-slate-950/80 rounded-lg border border-red-900/60 space-y-1.5 text-[11px]">
                      <div className="text-cyan-300 font-bold">AUTOMATED PREEMPTION RESULTS:</div>
                      <div className="flex justify-between text-slate-300">
                        <span>Preempted Runway:</span>
                        <strong className="text-yellow-300">RWY {flight.assignedRunwayId?.replace('RWY-', '') || '09L/27R'}</strong>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Cleared Slot Time:</span>
                        <strong className="text-white">
                          @{formatMinutesToTime(flight.scheduledTimeMinutes || currentSimTimeMinutes)} (Immediate Vector)
                        </strong>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Queue Priority Score:</span>
                        <strong className="text-red-400 text-xs">{flight.priorityScore.toFixed(1)} (Surged to #1)</strong>
                      </div>
                    </div>

                    {/* Resolution Actions */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => setActiveTab('gantt')}
                        className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1"
                      >
                        Inspect on Gantt Timeline →
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => divertFlight(flight.id, 'Emergency diversion to alternate international airport')}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg"
                        >
                          Divert Alternate
                        </button>
                        <button
                          onClick={() => resolveEmergency(flight.id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm"
                        >
                          Resolve & Normalize
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Emergency Activity Log Snippet */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs">
            <h4 className="text-xs font-bold text-slate-300 uppercase mb-2">
              RECENT EMERGENCY DISPATCH LOG:
            </h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {activityLogs
                .filter(l => l.badgeType === 'emergency')
                .slice(0, 5)
                .map(l => (
                  <div key={l.id} className="p-2 rounded bg-slate-950 border border-red-900/30 text-[11px] text-red-200">
                    <span className="text-slate-500 mr-2">[{l.timestamp}]</span>
                    {l.message}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
