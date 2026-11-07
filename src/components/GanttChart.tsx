import React, { useState, useMemo } from 'react';
import {
  GanttChartSquare,
  ZoomIn,
  ZoomOut,
  Clock,
  Plane,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAirport } from '../context/AirportContext';
import { Flight } from '../types';
import { formatMinutesToTime } from '../utils/scheduler';

export const GanttChart: React.FC = () => {
  const {
    runways,
    flights,
    currentSimTimeMinutes,
    setActiveTab,
    triggerEmergency
  } = useAirport();

  // Zoom view: 30 minutes, 60 minutes, or 120 minutes window
  const [windowDuration, setWindowDuration] = useState<number>(60);
  const [timeOffsetMinutes, setTimeOffsetMinutes] = useState<number>(0);
  const [inspectedFlight, setInspectedFlight] = useState<Flight | null>(null);

  // Time window bounds
  const startWindow = Math.floor(currentSimTimeMinutes) - 10 + timeOffsetMinutes;
  const endWindow = startWindow + windowDuration;

  // Generate 10-minute grid tick marks
  const tickMarks = useMemo(() => {
    const ticks: number[] = [];
    const firstTick = Math.ceil(startWindow / 10) * 10;
    for (let t = firstTick; t <= endWindow; t += 10) {
      ticks.push(t);
    }
    return ticks;
  }, [startWindow, endWindow]);

  // Pixel percentage converter for a given time
  const getPercentOffset = (timeMinutes: number): number => {
    return ((timeMinutes - startWindow) / windowDuration) * 100;
  };

  const getPercentWidth = (durationMinutes: number): number => {
    return (durationMinutes / windowDuration) * 100;
  };

  // Now indicator position
  const nowPercent = getPercentOffset(currentSimTimeMinutes);

  return (
    <div className="space-y-6">
      {/* Control Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GanttChartSquare className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
              LIVE RUNWAY OCCUPANCY & SEPARATION GANTT TIMELINE
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            HORIZONTAL ALLOCATION TRACKS · WAKE SEPARATION SLOTS · REAL-TIME PREEMPTION REACTION
          </p>
        </div>

        {/* Zoom & Window Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Legend */}
          <div className="hidden xl:flex items-center gap-3 text-xs font-mono text-slate-400 mr-2">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-600"></span> Emergency P1
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600"></span> Landing P2
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-600"></span> Takeoff P3
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-700"></span> Maintenance
            </span>
          </div>

          {/* Time Navigation */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setTimeOffsetMinutes(prev => prev - 15)}
              className="p-1 hover:text-white text-slate-400"
              title="Step -15 mins"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTimeOffsetMinutes(0)}
              className="px-2 py-1 text-[11px] text-cyan-400 font-semibold hover:text-cyan-300"
              title="Reset view to Now"
            >
              Current Time
            </button>
            <button
              onClick={() => setTimeOffsetMinutes(prev => prev + 15)}
              className="p-1 hover:text-white text-slate-400"
              title="Step +15 mins"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Level */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            {[30, 60, 120].map(dur => (
              <button
                key={dur}
                onClick={() => setWindowDuration(dur)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  windowDuration === dur ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {dur}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gantt Visual Chart Surface */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl select-none">
        {/* Timeline Header (Time Scale Ticks) */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 font-mono text-xs">
          <div className="w-44 shrink-0 p-3 text-slate-400 uppercase text-[11px] font-bold border-r border-slate-800">
            Runway
          </div>

          {/* Time Axis Bar */}
          <div className="relative flex-1 h-10 overflow-hidden">
            {tickMarks.map(tick => {
              const left = getPercentOffset(tick);
              if (left < 0 || left > 100) return null;
              return (
                <div
                  key={tick}
                  className="absolute top-0 bottom-0 flex flex-col items-center -translate-x-1/2"
                  style={{ left: `${left}%` }}
                >
                  <span className="text-[10px] text-slate-400 pt-1.5 tabular-nums font-semibold">
                    {formatMinutesToTime(tick)}
                  </span>
                  <div className="w-px h-2 bg-slate-700 mt-auto" />
                </div>
              );
            })}

            {/* Current Time NOW Pin */}
            {nowPercent >= 0 && nowPercent <= 100 && (
              <div
                className="absolute top-0 bottom-0 z-30 flex flex-col items-center pointer-events-none -translate-x-1/2"
                style={{ left: `${nowPercent}%` }}
              >
                <div className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-bold tracking-wider">
                  NOW
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Runway Rows */}
        <div className="divide-y divide-slate-800/80 relative">
          {/* NOW Vertical Needle across all lanes */}
          {nowPercent >= 0 && nowPercent <= 100 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-500/80 z-20 pointer-events-none -translate-x-1/2 shadow-lg"
              style={{ left: `calc(11rem + (100% - 11rem) * (${nowPercent} / 100))` }}
            />
          )}

          {runways.map(rwy => {
            // Find all flights assigned to this runway
            const assignedFlights = flights.filter(
              f => f.assignedRunwayId === rwy.id && f.scheduledTimeMinutes !== null && f.status !== 'Completed' && f.status !== 'Diverted'
            );

            return (
              <div key={rwy.id} className="flex min-h-[90px] relative hover:bg-slate-800/20 transition-colors">
                {/* Runway Label Column */}
                <div className="w-44 shrink-0 p-3 border-r border-slate-800 flex flex-col justify-center bg-slate-950/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white text-sm">
                      {rwy.name}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase ${
                        rwy.status === 'Available'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                          : rwy.status === 'Occupied'
                          ? 'bg-amber-950/60 text-amber-400 border-amber-800'
                          : 'bg-red-950/60 text-red-400 border-red-800'
                      }`}
                    >
                      {rwy.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {rwy.lengthMeters}m · {rwy.supportedOperations}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono">
                    Util: {rwy.utilizationPercent}%
                  </div>
                </div>

                {/* Timeline Lane */}
                <div className="relative flex-1 h-full min-h-[90px] overflow-hidden bg-slate-950/20">
                  {/* Vertical grid lines for 10 min marks */}
                  {tickMarks.map(tick => {
                    const left = getPercentOffset(tick);
                    if (left < 0 || left > 100) return null;
                    return (
                      <div
                        key={tick}
                        className="absolute top-0 bottom-0 w-px border-r border-dashed border-slate-800/60 pointer-events-none"
                        style={{ left: `${left}%` }}
                      />
                    );
                  })}

                  {/* Maintenance block if runway is in maintenance */}
                  {rwy.status === 'Maintenance' && (
                    <div
                      className="absolute top-2 bottom-2 left-0 right-0 bg-red-950/30 border border-red-800/50 rounded flex items-center justify-center font-mono text-xs text-red-300 font-bold tracking-wider"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(45deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.08) 10px, transparent 10px, transparent 20px)'
                      }}
                    >
                      RUNWAY CLOSED FOR MAINTENANCE · SURFACE SWEEP IN PROGRESS
                    </div>
                  )}

                  {/* Flight Scheduled Blocks */}
                  {assignedFlights.map(flight => {
                    const startMin = flight.scheduledTimeMinutes || 0;
                    const duration = flight.durationMinutes || 3.0;

                    const leftPercent = getPercentOffset(startMin);
                    const widthPercent = Math.max(2.5, getPercentWidth(duration));

                    // If completely outside window, skip
                    if (leftPercent + widthPercent < 0 || leftPercent > 100) return null;

                    const isEmergency = flight.priority === 'P1';
                    const isLanding = flight.operation === 'Landing';

                    let blockClass = 'bg-blue-600 border-blue-400 text-white';
                    if (isEmergency) blockClass = 'bg-red-600 border-red-400 text-white animate-pulse shadow-lg shadow-red-600/30';
                    else if (!isLanding) blockClass = 'bg-emerald-600 border-emerald-400 text-white';

                    return (
                      <button
                        key={flight.id}
                        onClick={() => setInspectedFlight(flight)}
                        className={`absolute top-2.5 bottom-2.5 rounded-lg border px-2 flex flex-col justify-center text-left shadow-md transition-transform hover:scale-[1.02] hover:z-30 cursor-pointer overflow-hidden ${blockClass}`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`
                        }}
                        title={`${flight.flightNumber} - ${flight.operation} (${formatMinutesToTime(startMin)})`}
                      >
                        <div className="flex items-center gap-1 font-mono font-bold text-[11px] truncate">
                          <Plane className="w-3 h-3 shrink-0" />
                          <span className="truncate">{flight.flightNumber}</span>
                        </div>
                        <div className="text-[9px] font-mono opacity-90 truncate">
                          {formatMinutesToTime(startMin)} · {flight.aircraftType} · {flight.fuelPercent}%F
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Gantt Timeline Footer Summary */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <span>WINDOW: {formatMinutesToTime(startWindow)} — {formatMinutesToTime(endWindow)}</span>
            <span>TIMELINE TICKS: 10 MIN INTERVALS</span>
          </div>
          <div className="text-cyan-400">
            CLICK ANY BLOCK TO INSPECT SEPARATION MARGINS & DETAILS
          </div>
        </div>
      </div>

      {/* Flight Detail Inspection Modal */}
      {inspectedFlight && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl font-mono text-xs text-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase">
                  SLOT INSPECTOR: {inspectedFlight.flightNumber}
                </h3>
              </div>
              <button
                onClick={() => setInspectedFlight(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-slate-300">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Carrier & Model:</span>
                <span className="text-white font-bold">{inspectedFlight.airline} ({inspectedFlight.aircraftName})</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Operation:</span>
                <span className={inspectedFlight.operation === 'Landing' ? 'text-blue-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {inspectedFlight.operation}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Wake Category:</span>
                <span className="text-cyan-300 font-bold">{inspectedFlight.aircraftType}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Assigned Runway:</span>
                <span className="text-yellow-300 font-bold">RWY {inspectedFlight.assignedRunwayId?.replace('RWY-', '')}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Scheduled Time:</span>
                <span className="text-white font-bold">{formatMinutesToTime(inspectedFlight.scheduledTimeMinutes || 0)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Fuel Level:</span>
                <span className={inspectedFlight.fuelPercent < 20 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {inspectedFlight.fuelPercent}%
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Priority Score:</span>
                <span className="text-cyan-400 font-bold">{inspectedFlight.priorityScore.toFixed(1)} ({inspectedFlight.priority})</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-300">
                <strong className="text-cyan-400 block mb-0.5">Allocation Reason:</strong>
                {inspectedFlight.priorityReason}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end gap-2">
              {inspectedFlight.priority !== 'P1' && (
                <button
                  onClick={() => {
                    triggerEmergency(inspectedFlight.id, 'low_fuel');
                    setInspectedFlight(null);
                  }}
                  className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 rounded font-bold"
                >
                  Declare Emergency
                </button>
              )}
              <button
                onClick={() => setInspectedFlight(null)}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
