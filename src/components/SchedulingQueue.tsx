import React, { useState } from 'react';
import {
  ListOrdered,
  Zap,
  HelpCircle,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Flame,
  Clock,
  Fuel,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAirport } from '../context/AirportContext';
import { Flight } from '../types';
import { formatMinutesToTime } from '../utils/scheduler';

export const SchedulingQueue: React.FC = () => {
  const {
    flights,
    weights,
    updateWeights,
    runSchedulerManually,
    triggerEmergency,
    resolveEmergency,
    currentSimTimeMinutes
  } = useAirport();

  const [expandedFlightId, setExpandedFlightId] = useState<string | null>(null);
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(true);

  // Active queue: flights that are waiting or scheduled (excluding Completed / Diverted)
  // Sorted strictly by priorityScore descending (Priority Queue order)
  const queueFlights = flights
    .filter(f => f.status !== 'Completed' && f.status !== 'Diverted')
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const toggleExpand = (id: string) => {
    setExpandedFlightId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Scoring Model Explainer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                AUTOMATIC RUNWAY SCHEDULING ENGINE & HEAP PRIORITY QUEUE
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              MAX-HEAP SCHEDULER · WEIGHTED MULTI-OBJECTIVE SCORING MODEL · O(log N) PREEMPTION
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-mono"
            >
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showFormulaDetails ? 'Hide Formula Math' : 'Show Formula Math'}</span>
            </button>

            <button
              onClick={runSchedulerManually}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg text-xs font-mono shadow-md transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Recalculate Heap Queue</span>
            </button>
          </div>
        </div>

        {/* Priority Formula Explanation Banner */}
        {showFormulaDetails && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/60 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-cyan-300 text-sm">
                MATHEMATICAL SCORING FORMULA:
              </span>
              <span className="text-white bg-slate-900 px-3 py-1 rounded border border-cyan-900/60 font-bold">
                Score = (α × WaitTime) + [β × (100 / Fuel%)] + γ_Class + EmergencySurge
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-300 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-cyan-400 font-bold mb-1">1. Latency Fairness (α = {weights.alpha})</div>
                <p className="text-slate-400">
                  Compensates aircraft in holding stacks or taxi queues. Prevents departure starvation as wait time increases.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-yellow-400 font-bold mb-1">2. Fuel Risk Factor (β = {weights.beta})</div>
                <p className="text-slate-400">
                  Inverse exponential curve: as fuel drops below 20%, score surges drastically to guarantee landing before minimum reserve.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-red-400 font-bold mb-1">3. Operational Class Base (γ)</div>
                <p className="text-slate-400">
                  <strong className="text-red-300">P1 Emergency: +{weights.gammaP1}</strong> · <strong className="text-blue-300">P2 Landing: +{weights.gammaP2}</strong> · <strong className="text-slate-300">P3 Takeoff: +{weights.gammaP3}</strong>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Priority Queue Manifest Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              REAL-TIME QUEUE RANKING ({queueFlights.length} AIRCRAFT SCHEDULED)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Heap Root: Position #1 executes next
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[11px]">
                <th className="py-3 px-4 w-16">Rank</th>
                <th className="py-3 px-3">Flight ID / Carrier</th>
                <th className="py-3 px-3">Model / Type</th>
                <th className="py-3 px-3">Op</th>
                <th className="py-3 px-3">Fuel</th>
                <th className="py-3 px-3">Wait Time</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Computed Score</th>
                <th className="py-3 px-3">Assigned Runway</th>
                <th className="py-3 px-3">Scheduled Slot</th>
                <th className="py-3 px-4 text-right">Reason & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {queueFlights.map((flight, idx) => {
                const rank = idx + 1;
                const isEmergency = flight.priority === 'P1';
                const isExpanded = expandedFlightId === flight.id;

                let rankBadge = 'bg-slate-800 text-slate-300';
                if (rank === 1) rankBadge = 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm';
                else if (rank <= 3) rankBadge = 'bg-blue-900/80 text-cyan-200';

                return (
                  <React.Fragment key={flight.id}>
                    <tr
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isEmergency ? 'bg-red-950/25' : ''
                      }`}
                    >
                      {/* Rank Position */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs ${rankBadge}`}>
                          #{rank}
                        </span>
                      </td>

                      {/* Flight ID */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-white text-xs">{flight.flightNumber}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{flight.airline}</div>
                      </td>

                      {/* Aircraft Model */}
                      <td className="py-3 px-3">
                        <div className="text-slate-200">{flight.aircraftName}</div>
                        <div className="text-[10px] text-slate-400">{flight.aircraftType}</div>
                      </td>

                      {/* Operation */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          flight.operation === 'Landing'
                            ? 'bg-blue-950/60 text-blue-300 border-blue-800'
                            : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                        }`}>
                          {flight.operation}
                        </span>
                      </td>

                      {/* Fuel */}
                      <td className="py-3 px-3">
                        <span className={`font-bold tabular-nums ${
                          flight.fuelPercent < 15 ? 'text-red-400 animate-pulse' : flight.fuelPercent < 25 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {Math.round(flight.fuelPercent)}%
                        </span>
                      </td>

                      {/* Wait Time */}
                      <td className="py-3 px-3">
                        <span className="text-slate-300 tabular-nums">{Math.round(flight.waitingTime)} min</span>
                      </td>

                      {/* Priority Class */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                          isEmergency
                            ? 'bg-red-950 text-red-200 border-red-700 animate-pulse'
                            : flight.priority === 'P2'
                            ? 'bg-blue-950 text-blue-200 border-blue-800'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {flight.priority}
                        </span>
                      </td>

                      {/* Computed Score */}
                      <td className="py-3 px-3">
                        <span className={`font-bold text-sm tabular-nums ${isEmergency ? 'text-red-400' : 'text-cyan-300'}`}>
                          {flight.priorityScore.toFixed(1)}
                        </span>
                      </td>

                      {/* Runway */}
                      <td className="py-3 px-3">
                        {flight.assignedRunwayId ? (
                          <span className="text-yellow-300 font-bold">
                            {flight.assignedRunwayId.replace('RWY-', '')}
                          </span>
                        ) : (
                          <span className="text-slate-400">Queue</span>
                        )}
                      </td>

                      {/* Scheduled Time */}
                      <td className="py-3 px-3">
                        <span className="text-white tabular-nums">
                          {formatMinutesToTime(flight.scheduledTimeMinutes || 0)}
                        </span>
                      </td>

                      {/* Reason & Actions */}
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => toggleExpand(flight.id)}
                          className="px-2 py-1 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px]"
                        >
                          {isExpanded ? 'Less' : 'Why Score?'}
                        </button>

                        {isEmergency ? (
                          <button
                            onClick={() => resolveEmergency(flight.id)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                          >
                            Resolve
                          </button>
                        ) : (
                          <button
                            onClick={() => triggerEmergency(flight.id, 'low_fuel')}
                            className="px-2 py-1 rounded bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 text-[11px]"
                          >
                            Preempt
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Score Dissection Row */}
                    {isExpanded && (
                      <tr className="bg-slate-950/90 border-b border-slate-800/80">
                        <td colSpan={11} className="p-4">
                          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs">
                            <div className="flex items-center justify-between text-cyan-300 font-bold">
                              <span>PRIORITY ALLOCATION REASON:</span>
                              <span className="text-slate-400 font-normal">Algorithm Step Verification</span>
                            </div>
                            <p className="text-slate-200">
                              {flight.priorityReason}
                            </p>
                            <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-4 text-[11px] text-slate-400">
                              <div>Wait Term: <span className="text-white">+{(weights.alpha * flight.waitingTime).toFixed(1)}</span></div>
                              <div>Fuel Urgency: <span className="text-white">+{(weights.beta * (100 / Math.max(5, flight.fuelPercent)) / 2).toFixed(1)}</span></div>
                              <div>Base Class Weight: <span className="text-white">+{flight.priority === 'P1' ? weights.gammaP1 : flight.priority === 'P2' ? weights.gammaP2 : weights.gammaP3}</span></div>
                              <div>Total Priority Score: <span className="text-cyan-400 font-bold">{flight.priorityScore.toFixed(1)}</span></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
