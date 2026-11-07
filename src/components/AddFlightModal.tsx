import React, { useState } from 'react';
import { Plus, X, Plane, AlertCircle } from 'lucide-react';
import { useAirport } from '../context/AirportContext';
import { FlightOperation, AircraftWeightCategory, PriorityClass } from '../types';
import { formatMinutesToTime } from '../utils/scheduler';

interface AddFlightModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddFlightModal: React.FC<AddFlightModalProps> = ({ isOpen, onClose }) => {
  const { addFlight, runways, currentSimTimeMinutes } = useAirport();

  const [flightNumber, setFlightNumber] = useState('');
  const [airline, setAirline] = useState('Delta Air Lines');
  const [aircraftName, setAircraftName] = useState('Airbus A350-900');
  const [aircraftType, setAircraftType] = useState<AircraftWeightCategory>('Heavy');
  const [origin, setOrigin] = useState('ATL');
  const [destination, setDestination] = useState('ATC HUB');
  const [operation, setOperation] = useState<FlightOperation>('Landing');
  const [fuelPercent, setFuelPercent] = useState(55);
  const [etaMinutesOffset, setEtaMinutesOffset] = useState(6);
  const [priority, setPriority] = useState<PriorityClass>('P2');
  const [assignedRunwayId, setAssignedRunwayId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightNumber.trim()) {
      setErrorMsg('Flight number is required (e.g. DL 450, BA 122).');
      return;
    }

    const estimatedTimeMinutes = currentSimTimeMinutes + etaMinutesOffset;

    addFlight({
      flightNumber: flightNumber.trim().toUpperCase(),
      callsign: flightNumber.trim().replace(/\s+/g, '').toUpperCase(),
      airline,
      aircraftName,
      aircraftType,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      operation,
      fuelPercent: Number(fuelPercent),
      estimatedTimeMinutes,
      priority,
      assignedRunwayId: assignedRunwayId || null
    });

    onClose();
  };

  const handleOperationChange = (op: FlightOperation) => {
    setOperation(op);
    if (op === 'Takeoff') {
      setOrigin('ATC HUB');
      setDestination('JFK');
      setPriority('P3');
      setFuelPercent(90);
    } else {
      setOrigin('ATL');
      setDestination('ATC HUB');
      setPriority('P2');
      setFuelPercent(45);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 text-slate-100 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white uppercase tracking-tight">
              REGISTER NEW INBOUND/OUTBOUND AIRCRAFT
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 mb-3 rounded-lg bg-red-950/80 border border-red-800 text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Flight Number & Airline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Flight Number *</label>
              <input
                type="text"
                value={flightNumber}
                onChange={e => {
                  setFlightNumber(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="e.g. DL 520, BA 340"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500 uppercase font-bold"
                required
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Airline Carrier</label>
              <input
                type="text"
                value={airline}
                onChange={e => setAirline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Aircraft Model & Weight Class */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Aircraft Model</label>
              <select
                value={aircraftName}
                onChange={e => {
                  const val = e.target.value;
                  setAircraftName(val);
                  if (val.includes('777') || val.includes('A350') || val.includes('A380') || val.includes('787')) {
                    setAircraftType('Heavy');
                  } else if (val.includes('Citation') || val.includes('Global')) {
                    setAircraftType('Light');
                  } else {
                    setAircraftType('Medium');
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Boeing 777-300ER">Boeing 777-300ER (Heavy)</option>
                <option value="Airbus A350-900">Airbus A350-900 (Heavy)</option>
                <option value="Boeing 787-9">Boeing 787-9 (Heavy)</option>
                <option value="Airbus A380-800">Airbus A380-800 (Super Heavy)</option>
                <option value="Airbus A320neo">Airbus A320neo (Medium)</option>
                <option value="Boeing 737-800">Boeing 737-800 (Medium)</option>
                <option value="Embraer E190">Embraer E190 (Medium)</option>
                <option value="Cessna Citation X">Cessna Citation X (Light)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Wake Turbulence Class</label>
              <select
                value={aircraftType}
                onChange={e => setAircraftType(e.target.value as AircraftWeightCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Heavy">Heavy (&gt;136,000 kg)</option>
                <option value="Medium">Medium (7,000 - 136,000 kg)</option>
                <option value="Light">Light (&lt;7,000 kg)</option>
              </select>
            </div>
          </div>

          {/* Operation & Route */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Operation</label>
              <select
                value={operation}
                onChange={e => handleOperationChange(e.target.value as FlightOperation)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
              >
                <option value="Landing">Landing (Inbound)</option>
                <option value="Takeoff">Takeoff (Outbound)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Origin</label>
              <input
                type="text"
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500 uppercase"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Destination</label>
              <input
                type="text"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500 uppercase"
              />
            </div>
          </div>

          {/* Fuel, ETA Offset, Priority */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Fuel Reserve ({fuelPercent}%)</label>
              <input
                type="range"
                min={5}
                max={100}
                value={fuelPercent}
                onChange={e => setFuelPercent(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">ETA in (+{etaMinutesOffset}m)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={etaMinutesOffset}
                onChange={e => setEtaMinutesOffset(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Priority Category</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as PriorityClass)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="P1">P1 (Emergency / Critical)</option>
                <option value="P2">P2 (Scheduled Landing)</option>
                <option value="P3">P3 (Normal Takeoff)</option>
              </select>
            </div>
          </div>

          {/* Assigned Runway */}
          <div>
            <label className="text-slate-400 block mb-1">Preferred Runway Assignment</label>
            <select
              value={assignedRunwayId}
              onChange={e => setAssignedRunwayId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">Auto-Allocate via Scheduling Engine (Recommended)</option>
              {runways.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} - Length {r.lengthMeters}m ({r.status})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <span className="text-[11px] text-slate-400">
              Est. Arrival Time: {formatMinutesToTime(currentSimTimeMinutes + etaMinutesOffset)}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Enlist Flight</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
