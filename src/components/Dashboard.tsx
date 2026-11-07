import React, { useState, useEffect, useRef } from 'react';
import {
  Plane,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  Fuel,
  Compass,
  ArrowRight,
  Filter,
  Volume2
} from 'lucide-react';
import { useAirport } from '../context/AirportContext';
import { Flight } from '../types';
import { formatMinutesToTime } from '../utils/scheduler';

export const Dashboard: React.FC = () => {
  const {
    flights,
    runways,
    activityLogs,
    currentSimTimeMinutes,
    setActiveTab,
    triggerEmergency,
    resolveEmergency,
    runSchedulerManually
  } = useAirport();

  const [activityFilter, setActivityFilter] = useState<'all' | 'emergency' | 'landing' | 'takeoff' | 'safety'>('all');
  const [selectedRadarFlight, setSelectedRadarFlight] = useState<Flight | null>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active flights calculations
  const activeFlights = flights.filter(f => f.status !== 'Completed' && f.status !== 'Diverted');
  const waitingLanding = activeFlights.filter(f => f.operation === 'Landing' && (f.status === 'Approaching' || f.status === 'Holding'));
  const waitingTakeoff = activeFlights.filter(f => f.operation === 'Takeoff' && (f.status === 'Queued'));
  const emergencyFlights = activeFlights.filter(f => f.priority === 'P1');
  const availableRunways = runways.filter(r => r.status === 'Available');
  const occupiedRunways = runways.filter(r => r.status === 'Occupied');
  
  // Calculate average waiting time
  const totalWait = activeFlights.reduce((acc, f) => acc + f.waitingTime, 0);
  const avgWaitTime = activeFlights.length > 0 ? (totalWait / activeFlights.length).toFixed(1) : '0.0';

  // Average Runway utilization
  const totalUtil = runways.reduce((acc, r) => acc + r.utilizationPercent, 0);
  const avgRunwayUtil = Math.round(totalUtil / runways.length);

  // Filtered activity log
  const filteredLogs = activityLogs.filter(log => {
    if (activityFilter === 'all') return true;
    return log.badgeType === activityFilter;
  });

  // Radar Screen Animation
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let sweepAngle = 0;
    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(cx, cy) - 20;

      ctx.clearRect(0, 0, w, h);

      // Dark radar background
      ctx.fillStyle = '#050b18';
      ctx.fillRect(0, 0, w, h);

      // Radial gradient glow from center
      const bgGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, maxR);
      bgGlow.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
      bgGlow.addColorStop(0.8, 'rgba(6, 182, 212, 0.02)');
      bgGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fill();

      // Range rings (10 NM, 20 NM, 30 NM, 40 NM)
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)';
      ctx.lineWidth = 1;
      [0.25, 0.5, 0.75, 1.0].forEach((ratio, idx) => {
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * ratio, 0, Math.PI * 2);
        ctx.stroke();

        // Distance labels
        ctx.fillStyle = 'rgba(103, 232, 249, 0.4)';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(`${(idx + 1) * 10} NM`, cx + 6, cy - (maxR * ratio) + 12);
      });

      // Compass azimuth ticks & crosshairs
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
      ctx.beginPath();
      ctx.moveTo(cx - maxR, cy);
      ctx.lineTo(cx + maxR, cy);
      ctx.moveTo(cx, cy - maxR);
      ctx.lineTo(cx, cy + maxR);
      ctx.stroke();

      // Center Airport Runways Layout (09L/27R, 09R/27L horizontal, 18L/36R, 18R/36L vertical)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      // Runway 09L/27R (horizontal top)
      ctx.beginPath();
      ctx.moveTo(cx - 35, cy - 8);
      ctx.lineTo(cx + 35, cy - 8);
      ctx.stroke();

      // Runway 09R/27L (horizontal bottom)
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy + 8);
      ctx.lineTo(cx + 30, cy + 8);
      ctx.stroke();

      // Runway 18L/36R (vertical right)
      ctx.beginPath();
      ctx.moveTo(cx + 12, cy - 30);
      ctx.lineTo(cx + 12, cy + 30);
      ctx.stroke();

      // Runway 18R/36L (vertical left)
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy - 25);
      ctx.lineTo(cx - 12, cy + 25);
      ctx.stroke();

      // Sweep Beam (Conic Gradient)
      const sweep = ctx.createConicGradient(sweepAngle, cx, cy);
      sweep.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
      sweep.addColorStop(0.08, 'rgba(6, 182, 212, 0.08)');
      sweep.addColorStop(0.2, 'rgba(6, 182, 212, 0)');
      sweep.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.fillStyle = sweep;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fill();

      // Plot active aircraft targets
      activeFlights.forEach((flight, i) => {
        // Compute pseudo radar coordinates based on distance & heading/index
        let dist = flight.distanceNm;
        if (flight.status === 'On Runway') dist = 0.5;
        const normDist = Math.min(1, dist / 45); // 0 to 1
        const r = normDist * maxR;

        // Angle based on destination/origin hash or index
        const angle = (i * 0.42 + (flight.operation === 'Takeoff' ? 1.5 : 0)) % (Math.PI * 2);

        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;

        const isEmergency = flight.priority === 'P1';
        const isLanding = flight.operation === 'Landing';
        const isSelected = selectedRadarFlight?.id === flight.id;

        // Blip style
        ctx.fillStyle = isEmergency ? '#ef4444' : isLanding ? '#38bdf8' : '#34d399';
        ctx.beginPath();
        ctx.arc(x, y, isEmergency ? 4.5 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Selected ring
        if (isSelected) {
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Velocity vector line (pointing towards runway center or outbound)
        const heading = isLanding ? Math.atan2(cy - y, cx - x) : Math.atan2(y - cy, x - cx);
        ctx.strokeStyle = isEmergency ? 'rgba(239, 68, 68, 0.6)' : 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(heading) * 12, y + Math.sin(heading) * 12);
        ctx.stroke();

        // Data tag label
        ctx.fillStyle = isEmergency ? '#fca5a5' : '#e2e8f0';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(flight.flightNumber, x + 6, y - 2);
        
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillText(`${Math.round(flight.altitudeFt / 100)}FL · ${flight.fuelPercent}%F`, x + 6, y + 8);
      });

      sweepAngle += 0.025;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeFlights, selectedRadarFlight]);

  // Click on radar canvas to inspect nearest flight
  const handleRadarClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(cx, cy) - 20;

    let closest: Flight | null = null;
    let minDistance = 25; // click radius threshold in px

    activeFlights.forEach((flight, i) => {
      let dist = flight.distanceNm;
      if (flight.status === 'On Runway') dist = 0.5;
      const normDist = Math.min(1, dist / 45);
      const r = normDist * maxR;
      const angle = (i * 0.42 + (flight.operation === 'Takeoff' ? 1.5 : 0)) % (Math.PI * 2);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      const d = Math.hypot(clickX - x, clickY - y);
      if (d < minDistance) {
        minDistance = d;
        closest = flight;
      }
    });

    setSelectedRadarFlight(closest);
  };

  return (
    <div className="space-y-6">
      {/* 8 Metric KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Aircraft */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase font-mono">Total Aircraft</span>
            <Plane className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {activeFlights.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">In terminal sector</div>
        </div>

        {/* Waiting for Landing */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase font-mono">Inbound Landing</span>
            <ArrowDownCircle className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono tabular-nums">
            {waitingLanding.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Holding & approach</div>
        </div>

        {/* Waiting for Takeoff */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase font-mono">Outbound Takeoff</span>
            <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {waitingTakeoff.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Holding at taxiway</div>
        </div>

        {/* Emergency Aircraft */}
        <div className={`p-3.5 rounded-xl border shadow-sm transition-all ${
          emergencyFlights.length > 0
            ? 'bg-red-950/40 border-red-500/60 text-red-200'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium uppercase font-mono text-red-400">Emergency</span>
            <AlertOctagon className={`w-4 h-4 ${emergencyFlights.length > 0 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono tabular-nums ${emergencyFlights.length > 0 ? 'text-red-400' : 'text-slate-400'}`}>
            {emergencyFlights.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Priority P1 flights</div>
        </div>

        {/* Available Runways */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase font-mono">Runways Open</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {availableRunways.length}
            <span className="text-xs text-slate-400 font-normal"> / {runways.length}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Ready for clearance</div>
        </div>

        {/* Occupied Runways */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase font-mono">Occupied</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums">
            {occupiedRunways.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Active rollout/takeoff</div>
        </div>

        {/* Average Waiting Time */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase font-mono">Avg Wait Time</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {avgWaitTime}
            <span className="text-xs text-slate-400 font-normal"> min</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Queue latency</div>
        </div>

        {/* Runway Utilization % */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase font-mono">Runway Util.</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono tabular-nums">
            {avgRunwayUtil}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Airport throughput</div>
        </div>
      </div>

      {/* Main Control Viewport: 2 Columns (Live Radar + Activity Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Airspace Terminal Radar Screen (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-lg">
          {/* Radar Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                TERMINAL AIRSPACE SURVEILLANCE RADAR
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span> Inbound
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Outbound
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400"></span> P1 Alert
              </span>
            </div>
          </div>

          {/* Interactive Radar Screen */}
          <div className="relative flex-1 bg-slate-950 flex items-center justify-center p-4">
            <canvas
              ref={radarCanvasRef}
              width={540}
              height={440}
              onClick={handleRadarClick}
              className="max-w-full h-auto cursor-crosshair rounded-lg border border-slate-800 shadow-inner"
            />

            {/* Selected Radar Flight Detail Overlay */}
            {selectedRadarFlight && (
              <div className="absolute top-6 left-6 max-w-xs bg-slate-900/95 border border-cyan-500/50 rounded-lg p-3 text-xs shadow-2xl backdrop-blur-md animate-in fade-in">
                <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-800">
                  <span className="font-bold text-cyan-300 font-mono">{selectedRadarFlight.flightNumber}</span>
                  <button
                    onClick={() => setSelectedRadarFlight(null)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                  <div>Model: <span className="text-white">{selectedRadarFlight.aircraftName} ({selectedRadarFlight.aircraftType})</span></div>
                  <div>Operation: <span className="text-white">{selectedRadarFlight.operation}</span></div>
                  <div>Fuel: <span className={selectedRadarFlight.fuelPercent < 20 ? 'text-red-400 font-bold' : 'text-emerald-400'}>{selectedRadarFlight.fuelPercent}%</span></div>
                  <div>Altitude: <span className="text-white">{selectedRadarFlight.altitudeFt} ft</span> · Speed: <span className="text-white">{selectedRadarFlight.speedKnots} kts</span></div>
                  <div>Status: <span className="text-cyan-400">{selectedRadarFlight.status}</span></div>
                  <div>Assigned: <span className="text-yellow-400">{selectedRadarFlight.assignedRunwayId?.replace('RWY-', '') || 'Unassigned'}</span></div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800 flex gap-2">
                  <button
                    onClick={() => setActiveTab('flights')}
                    className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] rounded text-center"
                  >
                    Manage Flight
                  </button>
                  {selectedRadarFlight.priority !== 'P1' && (
                    <button
                      onClick={() => triggerEmergency(selectedRadarFlight.id, 'low_fuel')}
                      className="py-1 px-2 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[10px] rounded"
                    >
                      Declare Emergency
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Radar Footer stats */}
          <div className="p-2.5 px-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>RADAR RANGE: 45 NM RADIUS</span>
            <span>TRANSPONDER: MODE S ENHANCED</span>
            <span className="text-cyan-400">CLICK BLIP TO INSPECT</span>
          </div>
        </div>

        {/* Right Column: Real-Time Activity Log Panel (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-lg">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                ATC REAL-TIME ACTIVITY LOG
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {filteredLogs.length} Events
            </span>
          </div>

          {/* Filter segment tabs */}
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/40 flex items-center gap-1 overflow-x-auto">
            {(['all', 'emergency', 'landing', 'takeoff', 'safety'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setActivityFilter(cat)}
                className={`px-2.5 py-1 text-[11px] font-mono uppercase rounded-md transition-colors ${
                  activityFilter === cat
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Activity items list */}
          <div className="p-3 space-y-2.5 flex-1 overflow-y-auto max-h-[460px]">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-mono">
                No activity logged under this filter.
              </div>
            ) : (
              filteredLogs.map(log => {
                let badgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
                if (log.badgeType === 'emergency') badgeClass = 'bg-red-950 text-red-300 border-red-800 font-bold';
                else if (log.badgeType === 'landing') badgeClass = 'bg-blue-950 text-blue-300 border-blue-800';
                else if (log.badgeType === 'takeoff') badgeClass = 'bg-emerald-950 text-emerald-300 border-emerald-800';
                else if (log.badgeType === 'safety') badgeClass = 'bg-amber-950 text-amber-300 border-amber-800';

                return (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${badgeClass}`}>
                        {log.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-mono leading-relaxed">
                      {log.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick jump to Gantt or Queue */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs font-mono">
            <button
              onClick={() => setActiveTab('gantt')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
            >
              <span>View Runway Gantt Timeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className="text-slate-400 hover:text-white"
            >
              Inspect Priority Queue →
            </button>
          </div>
        </div>
      </div>

      {/* Runway Status Overview Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              RUNWAY OPERATIONAL STATUS (4 ACTIVE RUNWAYS)
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('runways')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
          >
            Manage Runways <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {runways.map(rwy => {
            const currentFlight = flights.find(f => f.id === rwy.currentFlightId);
            const nextFlight = flights.find(f => f.id === rwy.nextFlightId);

            let statusColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-800';
            if (rwy.status === 'Occupied') statusColor = 'text-amber-400 bg-amber-950/40 border-amber-800';
            if (rwy.status === 'Maintenance') statusColor = 'text-red-400 bg-red-950/40 border-red-800';

            return (
              <div
                key={rwy.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white font-mono">{rwy.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({rwy.lengthMeters}m)</span>
                  </div>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded border uppercase ${statusColor}`}>
                    {rwy.status}
                  </span>
                </div>

                <div className="space-y-2 mt-3 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Current Active:</span>
                    <span className="text-white font-semibold">
                      {currentFlight ? `${currentFlight.flightNumber} (${currentFlight.operation})` : 'None'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Next Scheduled:</span>
                    <span className="text-cyan-400">
                      {nextFlight ? `${nextFlight.flightNumber} @ ${formatMinutesToTime(nextFlight.scheduledTimeMinutes || 0)}` : 'Clear'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Utilization:</span>
                    <span className="text-white">{rwy.utilizationPercent}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full ${
                        rwy.status === 'Maintenance' ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                      }`}
                      style={{ width: `${rwy.utilizationPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
