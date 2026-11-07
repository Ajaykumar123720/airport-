import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  Plane,
  ArrowDownCircle,
  ArrowUpCircle,
  Fuel,
  Clock,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { useAirport } from '../context/AirportContext';
import { Flight, FlightOperation, AircraftWeightCategory, PriorityClass, FlightStatus } from '../types';
import { formatMinutesToTime, parseTimeToMinutes } from '../utils/scheduler';

interface FlightManagementProps {
  onOpenAddModal: () => void;
}

export const FlightManagement: React.FC<FlightManagementProps> = ({ onOpenAddModal }) => {
  const {
    flights,
    runways,
    deleteFlight,
    updateFlight,
    triggerEmergency,
    resolveEmergency,
    divertFlight,
    currentSimTimeMinutes
  } = useAirport();

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [opFilter, setOpFilter] = useState<'all' | 'Landing' | 'Takeoff'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'P1' | 'P2' | 'P3'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'Completed' | 'Diverted'>('active');
  const [sortField, setSortField] = useState<'priorityScore' | 'fuelPercent' | 'estimatedTimeMinutes' | 'waitingTime'>('priorityScore');
  const [sortAsc, setSortAsc] = useState(false);

  // Edit modal state
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [deleteConfirmFlight, setDeleteConfirmFlight] = useState<Flight | null>(null);

  // Filter and sort flights
  const filteredFlights = useMemo(() => {
    return flights
      .filter(flight => {
        // Search query
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          flight.flightNumber.toLowerCase().includes(query) ||
          flight.id.toLowerCase().includes(query) ||
          flight.airline.toLowerCase().includes(query) ||
          flight.aircraftName.toLowerCase().includes(query) ||
          flight.origin.toLowerCase().includes(query) ||
          flight.destination.toLowerCase().includes(query);

        // Operation filter
        const matchesOp = opFilter === 'all' || flight.operation === opFilter;

        // Priority filter
        const matchesPriority = priorityFilter === 'all' || flight.priority === priorityFilter;

        // Status filter
        let matchesStatus = true;
        if (statusFilter === 'active') {
          matchesStatus = flight.status !== 'Completed' && flight.status !== 'Diverted';
        } else if (statusFilter !== 'all') {
          matchesStatus = flight.status === statusFilter;
        }

        return matchesSearch && matchesOp && matchesPriority && matchesStatus;
      })
      .sort((a, b) => {
        let valA = a[sortField] || 0;
        let valB = b[sortField] || 0;
        return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
  }, [flights, searchQuery, opFilter, priorityFilter, statusFilter, sortField, sortAsc]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlight) return;
    updateFlight(editingFlight.id, editingFlight);
    setEditingFlight(null);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar: Title, Search, Filters, Add Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search Flight ID, Callsign, Airline, Model, City..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Operation Filter */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            {(['all', 'Landing', 'Takeoff'] as const).map(op => (
              <button
                key={op}
                onClick={() => setOpFilter(op)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  opFilter === op ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {op === 'all' ? 'All Ops' : op}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            {(['all', 'P1', 'P2', 'P3'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  priorityFilter === p ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 'all' ? 'All Priority' : p}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="active">Active In-Sector</option>
            <option value="all">All Records</option>
            <option value="Completed">Completed Only</option>
            <option value="Diverted">Diverted Only</option>
          </select>

          {/* Add Flight Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Flight</span>
          </button>
        </div>
      </div>

      {/* Flight Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              FLIGHT MANIFEST & RUNWAY ALLOCATION ({filteredFlights.length} FLIGHTS)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Sorted by: {sortField} ({sortAsc ? 'ASC' : 'DESC'})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase text-[11px]">
                <th className="py-3 px-4">Flight / Airline</th>
                <th className="py-3 px-3">Aircraft Model</th>
                <th className="py-3 px-3">Operation</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => handleSort('fuelPercent')}
                >
                  <div className="flex items-center gap-1">
                    <span>Fuel %</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => handleSort('estimatedTimeMinutes')}
                >
                  <div className="flex items-center gap-1">
                    <span>ETA / ETD</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => handleSort('waitingTime')}
                >
                  <div className="flex items-center gap-1">
                    <span>Wait</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Priority</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => handleSort('priorityScore')}
                >
                  <div className="flex items-center gap-1">
                    <span>Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Runway Slot</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredFlights.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No aircraft match the active search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredFlights.map(flight => {
                  const isEmergency = flight.priority === 'P1';
                  const isLanding = flight.operation === 'Landing';

                  return (
                    <tr
                      key={flight.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isEmergency ? 'bg-red-950/20' : ''
                      }`}
                    >
                      {/* Flight / Airline */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">{flight.flightNumber}</div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          {flight.airline} · <span className="font-mono text-cyan-400">{flight.origin} → {flight.destination}</span>
                        </div>
                      </td>

                      {/* Aircraft Model */}
                      <td className="py-3 px-3">
                        <div className="text-slate-200">{flight.aircraftName}</div>
                        <div className="text-[10px] text-slate-400">
                          {flight.aircraftType} Wake Cat
                        </div>
                      </td>

                      {/* Operation */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${
                            isLanding
                              ? 'bg-blue-950/60 text-blue-300 border-blue-800/80'
                              : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                          }`}
                        >
                          {isLanding ? <ArrowDownCircle className="w-3 h-3" /> : <ArrowUpCircle className="w-3 h-3" />}
                          <span>{flight.operation}</span>
                        </span>
                      </td>

                      {/* Fuel Level */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold tabular-nums ${
                              flight.fuelPercent < 15
                                ? 'text-red-400 animate-pulse'
                                : flight.fuelPercent < 25
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {Math.round(flight.fuelPercent)}%
                          </span>
                        </div>
                        <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              flight.fuelPercent < 15
                                ? 'bg-red-500'
                                : flight.fuelPercent < 25
                                ? 'bg-amber-400'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, flight.fuelPercent)}%` }}
                          />
                        </div>
                      </td>

                      {/* ETA / ETD */}
                      <td className="py-3 px-3">
                        <span className="text-slate-200 tabular-nums">
                          {formatMinutesToTime(flight.estimatedTimeMinutes)}
                        </span>
                      </td>

                      {/* Wait Time */}
                      <td className="py-3 px-3">
                        <span className="text-slate-300 tabular-nums">
                          {Math.round(flight.waitingTime)}m
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                            isEmergency
                              ? 'bg-red-950 text-red-200 border-red-700 animate-pulse'
                              : flight.priority === 'P2'
                              ? 'bg-blue-950 text-blue-200 border-blue-800'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {flight.priority}
                        </span>
                      </td>

                      {/* Priority Score */}
                      <td className="py-3 px-3">
                        <span className={`font-bold tabular-nums ${isEmergency ? 'text-red-400 text-sm' : 'text-cyan-300'}`}>
                          {flight.priorityScore.toFixed(1)}
                        </span>
                      </td>

                      {/* Assigned Runway */}
                      <td className="py-3 px-3">
                        {flight.assignedRunwayId ? (
                          <div>
                            <span className="font-bold text-yellow-300">
                              RWY {flight.assignedRunwayId.replace('RWY-', '')}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              @{formatMinutesToTime(flight.scheduledTimeMinutes || 0)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">Pending</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className="text-slate-200">{flight.status}</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        {/* Emergency Toggle */}
                        {isEmergency ? (
                          <button
                            onClick={() => resolveEmergency(flight.id)}
                            className="px-2 py-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                            title="Resolve Emergency"
                          >
                            Resolve
                          </button>
                        ) : (
                          <button
                            onClick={() => triggerEmergency(flight.id, 'low_fuel')}
                            className="px-2 py-1 text-[10px] font-semibold bg-red-950/60 hover:bg-red-900 text-red-300 rounded border border-red-800/80"
                            title="Trigger Emergency Preemption"
                          >
                            Mayday
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          onClick={() => setEditingFlight(flight)}
                          className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                          title="Edit Flight Parameters"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteConfirmFlight(flight)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Remove Flight from ATC"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Flight Modal */}
      {editingFlight && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                EDIT FLIGHT {editingFlight.flightNumber}
              </h3>
              <button
                onClick={() => setEditingFlight(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Flight Number</label>
                  <input
                    type="text"
                    value={editingFlight.flightNumber}
                    onChange={e => setEditingFlight({ ...editingFlight, flightNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Airline</label>
                  <input
                    type="text"
                    value={editingFlight.airline}
                    onChange={e => setEditingFlight({ ...editingFlight, airline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Aircraft Name</label>
                  <input
                    type="text"
                    value={editingFlight.aircraftName}
                    onChange={e => setEditingFlight({ ...editingFlight, aircraftName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Weight Category</label>
                  <select
                    value={editingFlight.aircraftType}
                    onChange={e => setEditingFlight({ ...editingFlight, aircraftType: e.target.value as AircraftWeightCategory })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Heavy">Heavy (Widebody)</option>
                    <option value="Medium">Medium (Narrowbody)</option>
                    <option value="Light">Light (Commuter / Jet)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Operation</label>
                  <select
                    value={editingFlight.operation}
                    onChange={e => setEditingFlight({ ...editingFlight, operation: e.target.value as FlightOperation })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Landing">Landing</option>
                    <option value="Takeoff">Takeoff</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Fuel Level (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editingFlight.fuelPercent}
                    onChange={e => setEditingFlight({ ...editingFlight, fuelPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Priority</label>
                  <select
                    value={editingFlight.priority}
                    onChange={e => setEditingFlight({ ...editingFlight, priority: e.target.value as PriorityClass })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="P1">P1 (Emergency)</option>
                    <option value="P2">P2 (Landing)</option>
                    <option value="P3">P3 (Takeoff)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Assigned Runway</label>
                  <select
                    value={editingFlight.assignedRunwayId || ''}
                    onChange={e => setEditingFlight({ ...editingFlight, assignedRunwayId: e.target.value || null })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">Auto-Assign</option>
                    {runways.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Flight Status</label>
                  <select
                    value={editingFlight.status}
                    onChange={e => setEditingFlight({ ...editingFlight, status: e.target.value as FlightStatus })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Approaching">Approaching</option>
                    <option value="Holding">Holding</option>
                    <option value="Queued">Queued</option>
                    <option value="Cleared">Cleared</option>
                    <option value="On Runway">On Runway</option>
                    <option value="Completed">Completed</option>
                    <option value="Diverted">Diverted</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingFlight(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmFlight && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white font-mono mb-2">
              CONFIRM REMOVAL
            </h3>
            <p className="text-xs text-slate-300 font-mono mb-4">
              Are you sure you want to remove flight <strong className="text-white">{deleteConfirmFlight.flightNumber}</strong> ({deleteConfirmFlight.aircraftName}) from the ATC airspace and scheduling queue?
            </p>
            <div className="flex justify-end gap-2 text-xs font-mono">
              <button
                onClick={() => setDeleteConfirmFlight(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteFlight(deleteConfirmFlight.id);
                  setDeleteConfirmFlight(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg"
              >
                Delete Flight
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
