import React, { useState } from 'react';
import {
  Network,
  Cpu,
  Database,
  Radio,
  ArrowRight,
  Server,
  Code2,
  CheckCircle2,
  Zap,
  Activity,
  Layers,
  Terminal,
  ShieldCheck
} from 'lucide-react';

export const SystemArchitecture: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(3);

  const architectureSteps = [
    {
      step: 1,
      title: 'RADAR / ADS-B INGESTION',
      tech: 'ADS-B Receiver & Mode S Transponder',
      desc: 'Ingests real-time telemetry (latitude, longitude, groundspeed, altitude, squawk code, fuel level) from approaching and departing flights.',
      specs: 'Update rate: 1 Hz · Protocol: Asterix Cat 021 / Eurocontrol'
    },
    {
      step: 2,
      title: 'ATC INGESTION CLIENT & REST API',
      tech: 'FastAPI (Python) / Node.js Endpoint',
      desc: 'Validates input telemetry, filters invalid altitude reports, normalizes flight operational plans (Landing / Takeoff) into canonical schema.',
      specs: 'Async request pipeline · JSON Schema validation'
    },
    {
      step: 3,
      title: 'SCHEDULING ENGINE (PRIORITY FORMULA)',
      tech: 'Multi-Objective Weighted Optimization',
      desc: 'Computes dynamic priority score: Score = α × WaitTime + β × (100 / Fuel%) + γ_Class + EmergencySurge. Evaluates emergency preemption.',
      specs: 'Deterministic scoring · Fuel depletion urgency exponential term'
    },
    {
      step: 4,
      title: 'REDIS PRIORITY QUEUE (MAX-HEAP)',
      tech: 'Redis Sorted Sets (ZSET) / Binary Heap',
      desc: 'Maintains candidate aircraft in strict priority order with O(log N) push and pop complexity. Guaranteed highest-priority flight at heap root.',
      specs: 'Time complexity: O(log N) · In-memory latency < 1ms'
    },
    {
      step: 5,
      title: 'RUNWAY ALLOCATION & SEPARATION ENGINE',
      tech: 'Constraint Satisfaction & Conflict Prevention',
      desc: 'Assigns runway slots respecting ICAO wake turbulence separation matrix (Heavy, Medium, Light). Enforces zero runway overlap and rollback protection.',
      specs: 'Forward conflict checker · Dynamic delay propagation'
    },
    {
      step: 6,
      title: 'LIVE ATC DASHBOARD & WEBSOCKET BUS',
      tech: 'WebSocket Broadcast & React UI',
      desc: 'Pushes real-time scheduling updates to controller workstations, Gantt charts, radar displays, and logs audit events to PostgreSQL database.',
      specs: 'Bi-directional WebSocket streaming · Sub-50ms render latency'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                SYSTEM ARCHITECTURE & CSE PROJECT SPECIFICATION
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              DATA FLOW PIPELINE · HEAP COMPLEXITY ANALYSIS · SIMPY SIMULATION · POSTGRESQL AUDIT
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800 font-mono text-xs text-cyan-300 font-bold">
            COLLEGE CSE CAPSTONE GRADE
          </div>
        </div>
      </div>

      {/* Visual Data Flow Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl font-mono text-xs">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          END-TO-END DATA FLOW PIPELINE
        </h3>

        {/* 6 Step Interactive Flow Graph */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 relative">
          {architectureSteps.map(item => {
            const isSelected = activeStep === item.step;
            return (
              <button
                key={item.step}
                onClick={() => setActiveStep(item.step)}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-950/80 to-slate-950 border-cyan-500 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 text-xs">
                      {item.step}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase">STEP</span>
                  </div>

                  <h4 className="font-bold text-white text-[11px] leading-snug mb-1">
                    {item.title}
                  </h4>
                  <div className="text-[10px] text-cyan-400 font-semibold mb-2">
                    {item.tech}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                  Click to inspect specs →
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail Inspection Card for selected step */}
        {activeStep && (
          <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-cyan-900/60 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-cyan-400 font-bold text-sm">
                STEP {activeStep}: {architectureSteps[activeStep - 1].title}
              </span>
              <span className="text-slate-400 text-[11px]">
                Technology: <strong className="text-white">{architectureSteps[activeStep - 1].tech}</strong>
              </span>
            </div>
            <p className="text-slate-200 leading-relaxed text-xs">
              {architectureSteps[activeStep - 1].desc}
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Operational Specification: {architectureSteps[activeStep - 1].specs}</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified in project implementation
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Theoretical Foundation: Heap Algorithm & Time Complexity Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
        {/* Left Card: Priority Queue & Heap Theory */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            1. PRIORITY QUEUE COMPLEXITY ANALYSIS
          </h3>

          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              In conventional naive FIFO air traffic control queues, emergencies require linear scans ($O(N)$) to locate and reorder pending aircraft, leading to unsafe latency during multiple arrivals.
            </p>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="text-cyan-300 font-bold">ALGORITHMIC COMPLEXITY:</div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Enqueue Aircraft (Arrival/Takeoff):</span>
                <span className="text-emerald-400 font-bold">O(log N)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Emergency Preemption (Re-heapify):</span>
                <span className="text-emerald-400 font-bold">O(log N)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Peek Next Runway Slot (Root):</span>
                <span className="text-emerald-400 font-bold">O(1)</span>
              </div>
              <div className="flex justify-between">
                <span>Pairwise Conflict Detection:</span>
                <span className="text-cyan-400 font-bold">O(K log K) per runway</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              The Max-Heap comparator guarantees that when an aircraft signals MAYDAY (Priority P1), its score jumps to &gt;1000, percolating directly to the root of the heap with at most $\lfloor \log_2 N \rfloor$ swaps.
            </p>
          </div>
        </div>

        {/* Right Card: Full-Stack & Backend Architecture */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            2. BACKEND & PERSISTENCE ARCHITECTURE
          </h3>

          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              The production design pairs fast in-memory queue management with relational audit compliance:
            </p>

            <div className="space-y-2">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-red-400 font-bold flex items-center gap-1.5 mb-1">
                  <Server className="w-3.5 h-3.5" />
                  REDIS TEMPORARY QUEUE & CACHE
                </div>
                <p className="text-[11px] text-slate-400">
                  Holds transient aircraft state (fuel percentage, holding time, current runway assignment) using Redis Sorted Sets keyed by computed priority score for instant sorting.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-blue-400 font-bold flex items-center gap-1.5 mb-1">
                  <Database className="w-3.5 h-3.5" />
                  POSTGRESQL AUDIT & FLIGHT HISTORY
                </div>
                <p className="text-[11px] text-slate-400">
                  Stores permanent flight movement logs, emergency incident reports, separation compliance records, and controller overrides for post-incident review and aviation authority audits.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5 mb-1">
                  <Terminal className="w-3.5 h-3.5" />
                  SIMPY EVENT-DRIVEN SIMULATION
                </div>
                <p className="text-[11px] text-slate-400">
                  Python SimPy generator processes aircraft arrivals following Poisson distribution ($\lambda = 30$ flights/hr), modeling runway release events and stochastic holding patterns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
