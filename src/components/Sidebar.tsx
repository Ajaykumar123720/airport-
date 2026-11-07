import React, { useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Plane,
  Sliders,
  ListOrdered,
  GanttChartSquare,
  AlertTriangle,
  ShieldAlert,
  BarChart3,
  Network,
  Settings as SettingsIcon,
  Radio
} from 'lucide-react';
import { useAirport } from '../context/AirportContext';
import { ActiveTab } from '../types';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    flights,
    conflicts,
    activeEmergencyFlight,
    runways
  } = useAirport();

  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active flight counts
  const pendingFlightsCount = flights.filter(f => f.status !== 'Completed' && f.status !== 'Diverted').length;
  const emergencyCount = flights.filter(f => f.priority === 'P1' && f.status !== 'Completed' && f.status !== 'Diverted').length;
  const occupiedRunwaysCount = runways.filter(r => r.status === 'Occupied').length;

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: string | number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'ATC Dashboard', icon: LayoutDashboard },
    { id: 'flights', label: 'Flight Management', icon: Plane, badge: pendingFlightsCount, badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800' },
    { id: 'runways', label: 'Runway Management', icon: Sliders, badge: `${occupiedRunwaysCount}/4`, badgeColor: 'bg-slate-800 text-slate-300 border-slate-700' },
    { id: 'queue', label: 'Priority Queue', icon: ListOrdered },
    { id: 'gantt', label: 'Runway Gantt Chart', icon: GanttChartSquare },
    {
      id: 'emergency',
      label: 'Emergency Console',
      icon: AlertTriangle,
      badge: emergencyCount > 0 ? emergencyCount : undefined,
      badgeColor: 'bg-rose-900/80 text-rose-200 border-rose-700 animate-pulse'
    },
    {
      id: 'safety',
      label: 'Safety & Separation',
      icon: ShieldAlert,
      badge: conflicts.length > 0 ? conflicts.length : undefined,
      badgeColor: 'bg-amber-900/80 text-amber-200 border-amber-700'
    },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'architecture', label: 'System Architecture', icon: Network },
    { id: 'settings', label: 'ATC Settings', icon: SettingsIcon }
  ];

  // Radar animation effect in sidebar
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(cx, cy) - 4;

      ctx.clearRect(0, 0, w, h);

      // Radar outer background
      ctx.fillStyle = '#060d1d';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Range rings
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.lineWidth = 1;
      [0.33, 0.66, 1.0].forEach(factor => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * factor, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      // Sweep gradient
      const sweepGrad = ctx.createConicGradient(angle, cx, cy);
      sweepGrad.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
      sweepGrad.addColorStop(0.12, 'rgba(6, 182, 212, 0.05)');
      sweepGrad.addColorStop(0.3, 'rgba(6, 182, 212, 0)');
      sweepGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Radar blips for flights
      const sampleBlips = [
        { r: 0.25, a: 0.8, isEmerg: false },
        { r: 0.48, a: 2.1, isEmerg: !!activeEmergencyFlight },
        { r: 0.72, a: 3.9, isEmerg: false },
        { r: 0.85, a: 5.2, isEmerg: false }
      ];

      sampleBlips.forEach(b => {
        const bx = cx + Math.cos(b.a) * (radius * b.r);
        const by = cy + Math.sin(b.a) * (radius * b.r);
        ctx.fillStyle = b.isEmerg ? '#f43f5e' : '#22d3ee';
        ctx.beginPath();
        ctx.arc(bx, by, b.isEmerg ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      angle += 0.035;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeEmergencyFlight]);

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none overflow-y-auto">
      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1">
        <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
          OPERATIONAL MODULES
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Mini Airspace Radar Monitor in Sidebar */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-semibold">SURVEILLANCE RADAR</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">50 NM</span>
        </div>

        <div className="flex justify-center">
          <div className="relative p-1 rounded-full bg-slate-900 border border-cyan-900/50 shadow-inner">
            <canvas ref={radarCanvasRef} width={150} height={150} className="rounded-full" />
          </div>
        </div>

        <div className="mt-2.5 text-center text-[10px] font-mono text-slate-400">
          SSR MODE S · PRIMARY BEACON ACTIVE
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="font-mono">PROJECT DEMO v2.4</span>
        <span className="text-emerald-400 font-mono flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          STABLE
        </span>
      </div>
    </aside>
  );
};
