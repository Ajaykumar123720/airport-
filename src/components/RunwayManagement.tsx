import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Plane,
  Clock,
  Layers,
  Sliders,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Flame
} from 'lucide-react';
import { useAirport } from '../context/AirportContext';
import { Runway, RunwayStatus } from '../types';
import { formatMinutesToTime } from '../utils/scheduler';

export const RunwayManagement: React.FC = () => {
  const {
    runways,
    flights,
    updateRunwayStatus,
    currentSimTimeMinutes,
    setActiveTab
  } = useAirport();

  const [maintenanceModalRwy, setMaintenanceModalRwy] = useState<Runway | null>(null);
  const [maintenanceReason, setMaintenanceReason] = useState('Routine rubber removal & surface friction test');

  const handleStatusChange = (rwy: Runway, newStatus: RunwayStatus) => {
    if (newStatus === 'Maintenance') {
      setMaintenanceModalRwy(rwy);
    } else {
      updateRunwayStatus(rwy.id, newStatus);
    }
  };

  const handleConfirmMaintenance = () => {
    if (maintenanceModalRwy) {
      updateRunwayStatus(maintenanceModalRwy.id, 'Maintenance', maintenanceReason);
      setMaintenanceModalRwy(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
              RUNWAY CONTROLLER & SURFACE INFRASTRUCTURE
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            4 CONCURRENT ALLOCATABLE RUNWAYS · CAT III ALL-WEATHER ILS EQUIPPED
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Available: {runways.filter(r => r.status === 'Available').length}
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Occupied: {runways.filter(r => r.status === 'Occupied').length}
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            Maintenance: {runways.filter(r => r.status === 'Maintenance').length}
          </span>
        </div>
      </div>

      {/* 4 Runway Detailed Operational Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {runways.map(rwy => {
          const currentFlight = flights.find(f => f.id === rwy.currentFlightId);
          const nextFlight = flights.find(f => f.id === rwy.nextFlightId);

          // All scheduled flights for this runway
          const assignedFlights = flights
            .filter(f => f.assignedRunwayId === rwy.id && f.status !== 'Completed' && f.status !== 'Diverted')
            .sort((a, b) => (a.scheduledTimeMinutes || 0) - (b.scheduledTimeMinutes || 0));

          let statusBadgeClass = 'bg-emerald-950/60 text-emerald-300 border-emerald-800';
          if (rwy.status === 'Occupied') statusBadgeClass = 'bg-amber-950/60 text-amber-300 border-amber-800';
          if (rwy.status === 'Maintenance') statusBadgeClass = 'bg-red-950/60 text-red-300 border-red-800';

          return (
            <div
              key={rwy.id}
              className={`bg-slate-900 border rounded-xl overflow-hidden shadow-md transition-all ${
                rwy.status === 'Maintenance' ? 'border-red-900/40' : 'border-slate-800'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-bold text-cyan-400 text-sm">
                    {rwy.name.split('/')[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                      RUNWAY {rwy.name}
                    </h3>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Length: <strong className="text-slate-200">{rwy.lengthMeters}m</strong> · ILS: <strong className="text-cyan-300">{rwy.ilsCategory}</strong> · Heading: {rwy.headingDeg}°
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border uppercase ${statusBadgeClass}`}>
                    {rwy.status}
                  </span>
                </div>
              </div>

              {/* Runway Visual Strip Schematic */}
              <div className="p-4 bg-slate-950 border-b border-slate-800">
                <div className="relative h-14 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between px-6 overflow-hidden">
                  {/* Asphalt texture & center dashes */}
                  <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 border-b-2 border-dashed border-yellow-500/60 h-0 w-auto" />

                  {/* Runway markings left */}
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-[10px] font-mono font-extrabold text-white tracking-widest">
                      {rwy.name.split('/')[0]}
                    </span>
                    <div className="w-3 h-0.5 bg-white/70 mt-0.5"></div>
                  </div>

                  {/* Active Aircraft on Runway */}
                  {currentFlight && (
                    <div className="relative z-10 px-3 py-1 rounded bg-amber-500 text-slate-950 font-bold font-mono text-[11px] flex items-center gap-1.5 shadow-lg animate-pulse">
                      <Plane className="w-3.5 h-3.5" />
                      <span>{currentFlight.flightNumber} ({currentFlight.operation})</span>
                    </div>
                  )}

                  {rwy.status === 'Maintenance' && (
                    <div className="relative z-10 px-3 py-1 rounded bg-red-600 text-white font-bold font-mono text-[11px] flex items-center gap-1.5 shadow-lg">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>SURFACE MAINTENANCE</span>
                    </div>
                  )}

                  {rwy.status === 'Available' && !currentFlight && (
                    <div className="relative z-10 text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>SURFACE CLEAR & NOMINAL</span>
                    </div>
                  )}

                  {/* Runway markings right */}
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-[10px] font-mono font-extrabold text-white tracking-widest">
                      {rwy.name.split('/')[1]}
                    </span>
                    <div className="w-3 h-0.5 bg-white/70 mt-0.5"></div>
                  </div>
                </div>
              </div>

              {/* Runway Details & Stats */}
              <div className="p-4 space-y-3 font-mono text-xs">
                {/* Current & Next Flight */}
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Currently Active:</span>
                    <span className="font-bold text-white text-xs">
                      {currentFlight ? `${currentFlight.flightNumber} · ${currentFlight.aircraftName}` : 'None (Vacant)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Next Scheduled:</span>
                    <span className="font-bold text-cyan-400 text-xs">
                      {nextFlight ? `${nextFlight.flightNumber} @ ${formatMinutesToTime(nextFlight.scheduledTimeMinutes || 0)}` : 'No inbound scheduled'}
                    </span>
                  </div>
                </div>

                {/* Utilization & Availability */}
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Availability Time:</span>
                    <span className="text-white">
                      {formatMinutesToTime(rwy.availableAtMinutes)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Capacity Utilization:</span>
                      <span className="text-cyan-300 font-bold">{rwy.utilizationPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${rwy.utilizationPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Maintenance Reason if any */}
                {rwy.status === 'Maintenance' && rwy.maintenanceReason && (
                  <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-900/60 text-red-200 text-[11px]">
                    <strong className="text-red-400">Notice to Airmen (NOTAM):</strong> {rwy.maintenanceReason}
                  </div>
                )}

                {/* Scheduled Slot Sequence */}
                <div>
                  <div className="text-[11px] text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>Upcoming Runway Sequence ({assignedFlights.length} aircraft):</span>
                    <button
                      onClick={() => setActiveTab('gantt')}
                      className="text-cyan-400 hover:text-cyan-300 text-[10px]"
                    >
                      View on Gantt →
                    </button>
                  </div>

                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {assignedFlights.length === 0 ? (
                      <div className="text-slate-400 text-[11px] py-2 text-center">
                        No upcoming flights queued for this runway.
                      </div>
                    ) : (
                      assignedFlights.map((f, i) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between p-1.5 rounded bg-slate-950 border border-slate-800/80 text-[11px]"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-bold">#{i + 1}</span>
                            <span className="text-white font-bold">{f.flightNumber}</span>
                            <span className="text-slate-400 text-[10px]">({f.operation})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={f.priority === 'P1' ? 'text-red-400 font-bold' : 'text-slate-300'}>
                              {f.priority}
                            </span>
                            <span className="text-cyan-400 font-mono">
                              @{formatMinutesToTime(f.scheduledTimeMinutes || 0)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Status Switcher Actions */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <span className="text-slate-400 text-[11px]">Set Runway Mode:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStatusChange(rwy, 'Available')}
                      disabled={rwy.status === 'Available'}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                        rwy.status === 'Available'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      Available
                    </button>

                    <button
                      onClick={() => handleStatusChange(rwy, 'Occupied')}
                      disabled={rwy.status === 'Occupied'}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                        rwy.status === 'Occupied'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      Occupied
                    </button>

                    <button
                      onClick={() => handleStatusChange(rwy, 'Maintenance')}
                      disabled={rwy.status === 'Maintenance'}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                        rwy.status === 'Maintenance'
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      Maintenance
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Maintenance Reason Modal */}
      {maintenanceModalRwy && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl font-mono text-xs text-slate-100">
            <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              DECLARE RUNWAY MAINTENANCE ({maintenanceModalRwy.name})
            </h3>
            <p className="text-slate-300 mb-4 leading-relaxed">
              Setting this runway to Maintenance will trigger the automated scheduling engine to immediately reroute scheduled aircraft to alternate available runways.
            </p>

            <div className="space-y-3 mb-4">
              <label className="text-slate-400 block">NOTAM / Maintenance Reason:</label>
              <textarea
                value={maintenanceReason}
                onChange={e => setMaintenanceReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setMaintenanceModalRwy(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMaintenance}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-md"
              >
                Confirm Maintenance Closure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
