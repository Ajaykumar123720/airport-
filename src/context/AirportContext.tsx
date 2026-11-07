import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Flight,
  Runway,
  SeparationRule,
  SchedulingWeights,
  ConflictAlert,
  ActivityLog,
  EmergencyType,
  RunwayStatus,
  FlightStatus,
  ActiveTab
} from '../types';
import {
  INITIAL_FLIGHTS,
  INITIAL_RUNWAYS,
  INITIAL_SEPARATION_RULES,
  INITIAL_WEIGHTS,
  INITIAL_ACTIVITY_LOGS,
  BASE_SIMULATION_TIME
} from '../utils/sampleData';
import {
  runAutomatedScheduler,
  formatMinutesToTime
} from '../utils/scheduler';

interface AirportContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  flights: Flight[];
  runways: Runway[];
  separationRules: SeparationRule[];
  weights: SchedulingWeights;
  currentSimTimeMinutes: number;
  formattedSimTime: string;
  isSimulating: boolean;
  simSpeed: number;
  activityLogs: ActivityLog[];
  conflicts: ConflictAlert[];
  activeEmergencyFlight: Flight | null;
  audioAlertsEnabled: boolean;
  autoScheduling: boolean;
  // Controls
  toggleSimulation: () => void;
  setSimSpeed: (speed: number) => void;
  resetSimulation: () => void;
  runSchedulerManually: () => void;
  // CRUD & Operations
  addFlight: (flight: Partial<Flight>) => boolean;
  updateFlight: (id: string, updates: Partial<Flight>) => void;
  deleteFlight: (id: string) => void;
  triggerEmergency: (flightId: string, emergencyType: EmergencyType, details?: string) => void;
  resolveEmergency: (flightId: string) => void;
  divertFlight: (flightId: string, reason?: string) => void;
  updateRunwayStatus: (runwayId: string, status: RunwayStatus, reason?: string) => void;
  updateSeparationRules: (rules: SeparationRule[]) => void;
  updateWeights: (weights: SchedulingWeights) => void;
  setAutoScheduling: (enabled: boolean) => void;
  setAudioAlertsEnabled: (enabled: boolean) => void;
  autoResolveConflicts: () => void;
  quickGenerateFlight: (operation?: 'Landing' | 'Takeoff') => void;
  dismissEmergencyBanner: () => void;
  emergencyBannerDismissed: boolean;
}

const AirportContext = createContext<AirportContextType | null>(null);

// Audio Alert helper using Web Audio API
const playAtcAlertTone = (frequency: number = 880, durationMs: number = 250) => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // Ignore audio restrictions
  }
};

export const AirportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  // Persistent state initialized from localStorage or defaults
  const [flights, setFlights] = useState<Flight[]>(() => {
    const saved = localStorage.getItem('atc_flights_v2');
    return saved ? JSON.parse(saved) : INITIAL_FLIGHTS;
  });

  const [runways, setRunways] = useState<Runway[]>(() => {
    const saved = localStorage.getItem('atc_runways_v2');
    return saved ? JSON.parse(saved) : INITIAL_RUNWAYS;
  });

  const [separationRules, setSeparationRules] = useState<SeparationRule[]>(() => {
    const saved = localStorage.getItem('atc_sep_rules_v2');
    return saved ? JSON.parse(saved) : INITIAL_SEPARATION_RULES;
  });

  const [weights, setWeights] = useState<SchedulingWeights>(() => {
    const saved = localStorage.getItem('atc_weights_v2');
    return saved ? JSON.parse(saved) : INITIAL_WEIGHTS;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('atc_logs_v2');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
  });

  const [conflicts, setConflicts] = useState<ConflictAlert[]>([]);
  const [currentSimTimeMinutes, setCurrentSimTimeMinutes] = useState<number>(BASE_SIMULATION_TIME);
  const [simSecondsFraction, setSimSecondsFraction] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [autoScheduling, setAutoScheduling] = useState<boolean>(true);
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState<boolean>(true);
  const [emergencyBannerDismissed, setEmergencyBannerDismissed] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('atc_flights_v2', JSON.stringify(flights));
  }, [flights]);

  useEffect(() => {
    localStorage.setItem('atc_runways_v2', JSON.stringify(runways));
  }, [runways]);

  useEffect(() => {
    localStorage.setItem('atc_sep_rules_v2', JSON.stringify(separationRules));
  }, [separationRules]);

  useEffect(() => {
    localStorage.setItem('atc_weights_v2', JSON.stringify(weights));
  }, [weights]);

  useEffect(() => {
    localStorage.setItem('atc_logs_v2', JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Active Emergency flight lookup
  const activeEmergencyFlight = flights.find(f => f.priority === 'P1' && f.status !== 'Completed' && f.status !== 'Diverted') || null;

  // Add an activity log entry
  const addLog = useCallback((category: ActivityLog['category'], message: string, badgeType: ActivityLog['badgeType'], flightId?: string) => {
    const timeStr = formatMinutesToTime(currentSimTimeMinutes) + `:${Math.floor(simSecondsFraction).toString().padStart(2, '0')}`;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timeStr,
      category,
      message,
      badgeType,
      flightId
    };
    setActivityLogs(prev => [newLog, ...prev.slice(0, 99)]);
  }, [currentSimTimeMinutes, simSecondsFraction]);

  // Core scheduler invocation
  const triggerScheduler = useCallback((flightsToSchedule: Flight[], runwaysToSchedule: Runway[], currentMinutes: number) => {
    const result = runAutomatedScheduler(flightsToSchedule, runwaysToSchedule, separationRules, weights, currentMinutes);
    setFlights(result.scheduledFlights);
    setRunways(result.updatedRunways);
    setConflicts(result.conflicts);
  }, [separationRules, weights]);

  // Initial scheduling run on mount
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      triggerScheduler(flights, runways, currentSimTimeMinutes);
    }
  }, [triggerScheduler, flights, runways, currentSimTimeMinutes]);

  // Simulation tick loop (advances flights, burns fuel, transitions runway status)
  useEffect(() => {
    if (!isSimulating) return;

    const intervalMs = 1000 / simSpeed;
    const timer = setInterval(() => {
      setSimSecondsFraction(prevSec => {
        let nextSec = prevSec + 5; // Advance 5 simulated seconds per tick
        let nextMinutes = currentSimTimeMinutes;
        if (nextSec >= 60) {
          nextMinutes += Math.floor(nextSec / 60);
          nextSec = nextSec % 60;
          setCurrentSimTimeMinutes(nextMinutes);
        }

        // Advance flight physics & state
        setFlights(prevFlights => {
          let stateChanged = false;
          const updated = prevFlights.map(flight => {
            if (flight.status === 'Completed' || flight.status === 'Diverted') {
              return flight;
            }

            let newStatus: FlightStatus = flight.status;
            let newFuel = flight.fuelPercent;
            let newDist = flight.distanceNm;
            let newAlt = flight.altitudeFt;
            let newSpeed = flight.speedKnots;
            let newWait = flight.waitingTime;

            // Fuel burn: Inbound airborne flights consume ~0.08% per sim minute
            if (flight.operation === 'Landing' && flight.status !== 'On Runway') {
              newFuel = Math.max(2, parseFloat((newFuel - 0.05).toFixed(2)));
            }

            // Increment wait time if holding or queued
            if (flight.status === 'Holding' || flight.status === 'Queued') {
              newWait = parseFloat((newWait + (5 / 60)).toFixed(2));
            }

            // Progression towards runway:
            const scheduledMin = flight.scheduledTimeMinutes || 0;
            const diffMin = scheduledMin - nextMinutes;

            if (flight.operation === 'Landing') {
              if (diffMin <= 0 && (flight.status === 'Cleared' || flight.status === 'Approaching')) {
                // Land on runway!
                newStatus = 'On Runway';
                newAlt = 0;
                newDist = 0;
                newSpeed = 130;
                stateChanged = true;
                addLog('LANDING', `TOUCHDOWN: ${flight.flightNumber} (${flight.aircraftName}) on runway ${flight.assignedRunwayId?.replace('RWY-', '') || '09L'}.`, 'landing', flight.id);
                if (audioAlertsEnabled) playAtcAlertTone(523, 200);
              } else if (diffMin <= - (flight.durationMinutes || 3.0) && flight.status === 'On Runway') {
                // Vacated runway
                newStatus = 'Completed';
                newSpeed = 0;
                stateChanged = true;
                addLog('RUNWAY', `${flight.flightNumber} vacates runway, taxiing to gate ${flight.gate || 'Terminal'}.`, 'system', flight.id);
              } else if (flight.status === 'Approaching' && diffMin <= 4) {
                newStatus = 'Cleared';
                newDist = Math.max(1, newDist - 0.5);
                newAlt = Math.max(500, newAlt - 250);
              } else if (flight.status === 'Approaching') {
                newDist = Math.max(3, newDist - 0.2);
                newAlt = Math.max(2000, newAlt - 100);
              }
            } else {
              // Takeoff operation
              if (diffMin <= 0 && flight.status === 'Cleared') {
                newStatus = 'On Runway';
                newSpeed = 150;
                stateChanged = true;
                addLog('TAKEOFF', `AIRBORNE: ${flight.flightNumber} rolling for departure on runway ${flight.assignedRunwayId?.replace('RWY-', '') || '18L'}.`, 'takeoff', flight.id);
                if (audioAlertsEnabled) playAtcAlertTone(659, 200);
              } else if (diffMin <= - (flight.durationMinutes || 2.5) && flight.status === 'On Runway') {
                newStatus = 'Completed';
                newAlt = 10000;
                newDist = 20;
                newSpeed = 280;
                stateChanged = true;
                addLog('TAKEOFF', `${flight.flightNumber} departed terminal airspace, climbing to cruising altitude.`, 'takeoff', flight.id);
              }
            }

            return {
              ...flight,
              fuelPercent: newFuel,
              distanceNm: parseFloat(newDist.toFixed(1)),
              altitudeFt: Math.round(newAlt),
              speedKnots: Math.round(newSpeed),
              waitingTime: newWait,
              status: newStatus
            };
          });

          // If auto scheduling is enabled and states moved, or every minute
          if (autoScheduling && (stateChanged || nextSec === 0)) {
            setTimeout(() => {
              triggerScheduler(updated, runways, nextMinutes);
            }, 0);
          }

          return updated;
        });

        return nextSec;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSimulating, simSpeed, currentSimTimeMinutes, autoScheduling, runways, triggerScheduler, addLog, audioAlertsEnabled]);

  // Handlers
  const toggleSimulation = () => setIsSimulating(prev => !prev);

  const resetSimulation = () => {
    setFlights(INITIAL_FLIGHTS);
    setRunways(INITIAL_RUNWAYS);
    setSeparationRules(INITIAL_SEPARATION_RULES);
    setWeights(INITIAL_WEIGHTS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setCurrentSimTimeMinutes(BASE_SIMULATION_TIME);
    setSimSecondsFraction(0);
    setEmergencyBannerDismissed(false);
    triggerScheduler(INITIAL_FLIGHTS, INITIAL_RUNWAYS, BASE_SIMULATION_TIME);
    addLog('SCHEDULE', 'Simulation reset to factory demonstration baseline.', 'system');
  };

  const runSchedulerManually = () => {
    triggerScheduler(flights, runways, currentSimTimeMinutes);
    addLog('SCHEDULE', 'Priority Queue recalculation & runway slot allocation executed manually.', 'system');
  };

  const addFlight = (flightData: Partial<Flight>): boolean => {
    const flightId = flightData.flightNumber ? flightData.flightNumber.replace(/\s+/g, '-') : `FL-${Date.now() % 10000}`;
    const newFlight: Flight = {
      id: flightId,
      callsign: flightData.callsign || flightId.replace('-', ''),
      airline: flightData.airline || 'Commercial Airline',
      aircraftName: flightData.aircraftName || 'Airbus A320neo',
      aircraftType: flightData.aircraftType || 'Medium',
      flightNumber: flightData.flightNumber || flightId,
      origin: flightData.origin || (flightData.operation === 'Takeoff' ? 'ATC HUB' : 'SFO'),
      destination: flightData.destination || (flightData.operation === 'Takeoff' ? 'LHR' : 'ATC HUB'),
      operation: flightData.operation || 'Landing',
      fuelPercent: flightData.fuelPercent !== undefined ? flightData.fuelPercent : 65,
      estimatedTimeMinutes: flightData.estimatedTimeMinutes || currentSimTimeMinutes + 5,
      scheduledTimeMinutes: null,
      assignedRunwayId: flightData.assignedRunwayId || null,
      priority: flightData.priority || (flightData.operation === 'Landing' ? 'P2' : 'P3'),
      emergencyType: flightData.emergencyType || 'none',
      emergencyDetails: flightData.emergencyDetails || '',
      waitingTime: 0,
      priorityScore: 0,
      priorityReason: 'Newly registered flight in ATC queue',
      status: flightData.operation === 'Takeoff' ? 'Queued' : 'Approaching',
      durationMinutes: flightData.aircraftType === 'Heavy' ? 3.0 : 2.5,
      speedKnots: flightData.operation === 'Takeoff' ? 0 : 220,
      altitudeFt: flightData.operation === 'Takeoff' ? 0 : 8000,
      distanceNm: flightData.operation === 'Takeoff' ? 0.2 : 25,
      gate: flightData.gate || 'T1-B08'
    };

    const updated = [newFlight, ...flights];
    setFlights(updated);
    addLog(
      flightData.operation === 'Landing' ? 'LANDING' : 'TAKEOFF',
      `New aircraft added: ${newFlight.flightNumber} (${newFlight.aircraftName}) - ${newFlight.operation}. Fuel: ${newFlight.fuelPercent}%.`,
      flightData.operation === 'Landing' ? 'landing' : 'takeoff',
      newFlight.id
    );

    triggerScheduler(updated, runways, currentSimTimeMinutes);
    return true;
  };

  const updateFlight = (id: string, updates: Partial<Flight>) => {
    const updated = flights.map(f => f.id === id ? { ...f, ...updates } : f);
    setFlights(updated);
    addLog('SCHEDULE', `Flight ${id} parameters updated by controller.`, 'system', id);
    triggerScheduler(updated, runways, currentSimTimeMinutes);
  };

  const deleteFlight = (id: string) => {
    const target = flights.find(f => f.id === id);
    const updated = flights.filter(f => f.id !== id);
    setFlights(updated);
    addLog('SCHEDULE', `Flight ${target?.flightNumber || id} deleted from ATC schedule.`, 'system', id);
    triggerScheduler(updated, runways, currentSimTimeMinutes);
  };

  const triggerEmergency = (flightId: string, emergencyType: EmergencyType, details?: string) => {
    const flight = flights.find(f => f.id === flightId);
    if (!flight) return;

    let desc = details;
    if (!desc) {
      if (emergencyType === 'low_fuel') desc = 'MAYDAY FUEL - critically below 15% minimum diversion reserve!';
      else if (emergencyType === 'engine_failure') desc = 'Engine #1 fire indication - single engine glide descent';
      else if (emergencyType === 'medical') desc = 'Critical cardiac medical emergency onboard passenger';
      else desc = 'MAYDAY - Hydraulic system Bravo failure, emergency landing required';
    }

    const updated = flights.map(f => {
      if (f.id === flightId) {
        return {
          ...f,
          priority: 'P1' as const,
          emergencyType,
          emergencyDetails: desc,
          fuelPercent: emergencyType === 'low_fuel' ? Math.min(f.fuelPercent, 12) : f.fuelPercent,
          status: f.status === 'On Runway' ? f.status : 'Approaching' as const
        };
      }
      return f;
    });

    setFlights(updated);
    setEmergencyBannerDismissed(false);
    addLog('EMERGENCY', `🚨 EMERGENCY DECLARED: ${flight.flightNumber} (${emergencyType.toUpperCase()}) - ${desc}. Preempting priority queue!`, 'emergency', flight.id);

    if (audioAlertsEnabled) {
      playAtcAlertTone(880, 500);
      setTimeout(() => playAtcAlertTone(1100, 600), 250);
    }

    triggerScheduler(updated, runways, currentSimTimeMinutes);
  };

  const resolveEmergency = (flightId: string) => {
    const updated = flights.map(f => {
      if (f.id === flightId) {
        return {
          ...f,
          priority: f.operation === 'Landing' ? ('P2' as const) : ('P3' as const),
          emergencyType: 'none' as const,
          emergencyDetails: undefined
        };
      }
      return f;
    });

    setFlights(updated);
    addLog('EMERGENCY', `Emergency condition for ${flightId} resolved. Normalized priority queue.`, 'safety', flightId);
    triggerScheduler(updated, runways, currentSimTimeMinutes);
  };

  const divertFlight = (flightId: string, reason?: string) => {
    const updated = flights.map(f => {
      if (f.id === flightId) {
        return {
          ...f,
          status: 'Diverted' as const,
          priorityReason: `Diverted to alternate airport: ${reason || 'Weather/Runway saturation'}`
        };
      }
      return f;
    });

    setFlights(updated);
    addLog('SAFETY', `Flight ${flightId} safely diverted to alternate airport (${reason || 'Controller instruction'}).`, 'safety', flightId);
    triggerScheduler(updated, runways, currentSimTimeMinutes);
  };

  const updateRunwayStatus = (runwayId: string, status: RunwayStatus, reason?: string) => {
    const updatedRunways = runways.map(r => {
      if (r.id === runwayId) {
        return {
          ...r,
          status,
          maintenanceReason: status === 'Maintenance' ? (reason || 'Scheduled maintenance') : undefined
        };
      }
      return r;
    });

    setRunways(updatedRunways);
    addLog('RUNWAY', `Runway ${runwayId.replace('RWY-', '')} status changed to ${status.toUpperCase()}${reason ? ` (${reason})` : ''}.`, 'system');
    triggerScheduler(flights, updatedRunways, currentSimTimeMinutes);
  };

  const updateSeparationRules = (rules: SeparationRule[]) => {
    setSeparationRules(rules);
    addLog('SAFETY', 'Wake turbulence separation matrix reconfigured by ATC administrator.', 'safety');
    triggerScheduler(flights, runways, currentSimTimeMinutes);
  };

  const updateWeights = (newWeights: SchedulingWeights) => {
    setWeights(newWeights);
    addLog('SCHEDULE', `Priority scoring weights updated (α=${newWeights.alpha}, β=${newWeights.beta}, γ_P1=${newWeights.gammaP1}).`, 'system');
    triggerScheduler(flights, runways, currentSimTimeMinutes);
  };

  const autoResolveConflicts = () => {
    // Re-run scheduler with conflict separation guarantees
    triggerScheduler(flights, runways, currentSimTimeMinutes);
    addLog('SAFETY', 'Automated conflict resolution executed: all runway separation gaps synchronized.', 'safety');
  };

  const quickGenerateFlight = (forcedOp?: 'Landing' | 'Takeoff') => {
    const op: 'Landing' | 'Takeoff' = forcedOp || (Math.random() > 0.5 ? 'Landing' : 'Takeoff');
    const airlines = [
      { code: 'BA', name: 'British Airways', prefix: 'BA' },
      { code: 'LH', name: 'Lufthansa', prefix: 'LH' },
      { code: 'EK', name: 'Emirates', prefix: 'EK' },
      { code: 'DL', name: 'Delta Air Lines', prefix: 'DL' },
      { code: 'UA', name: 'United Airlines', prefix: 'UA' },
      { code: 'QR', name: 'Qatar Airways', prefix: 'QR' },
      { code: 'SQ', name: 'Singapore Airlines', prefix: 'SQ' },
      { code: 'AF', name: 'Air France', prefix: 'AF' }
    ];
    const models: { name: string; type: Flight['aircraftType'] }[] = [
      { name: 'Boeing 777-300ER', type: 'Heavy' },
      { name: 'Airbus A350-900', type: 'Heavy' },
      { name: 'Boeing 787-9', type: 'Heavy' },
      { name: 'Airbus A320neo', type: 'Medium' },
      { name: 'Boeing 737 MAX 9', type: 'Medium' },
      { name: 'Embraer E195-E2', type: 'Medium' },
      { name: 'Bombardier Global 7500', type: 'Light' }
    ];

    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const model = models[Math.floor(Math.random() * models.length)];
    const num = Math.floor(100 + Math.random() * 899);
    const flightNumber = `${airline.prefix} ${num}`;
    const fuel = op === 'Landing' ? Math.floor(18 + Math.random() * 60) : Math.floor(80 + Math.random() * 20);

    addFlight({
      flightNumber,
      callsign: `${airline.code}${num}`,
      airline: airline.name,
      aircraftName: model.name,
      aircraftType: model.type,
      operation: op,
      fuelPercent: fuel,
      estimatedTimeMinutes: currentSimTimeMinutes + Math.floor(2 + Math.random() * 8)
    });
  };

  const formattedSimTime = `${formatMinutesToTime(currentSimTimeMinutes)}:${Math.floor(simSecondsFraction).toString().padStart(2, '0')}`;

  return (
    <AirportContext.Provider
      value={{
        activeTab,
        setActiveTab,
        flights,
        runways,
        separationRules,
        weights,
        currentSimTimeMinutes,
        formattedSimTime,
        isSimulating,
        simSpeed,
        activityLogs,
        conflicts,
        activeEmergencyFlight,
        audioAlertsEnabled,
        autoScheduling,
        toggleSimulation,
        setSimSpeed,
        resetSimulation,
        runSchedulerManually,
        addFlight,
        updateFlight,
        deleteFlight,
        triggerEmergency,
        resolveEmergency,
        divertFlight,
        updateRunwayStatus,
        updateSeparationRules,
        updateWeights,
        setAutoScheduling,
        setAudioAlertsEnabled,
        autoResolveConflicts,
        quickGenerateFlight,
        dismissEmergencyBanner: () => setEmergencyBannerDismissed(true),
        emergencyBannerDismissed
      }}
    >
      {children}
    </AirportContext.Provider>
  );
};

export const useAirport = () => {
  const context = useContext(AirportContext);
  if (!context) {
    throw new Error('useAirport must be used within an AirportProvider');
  }
  return context;
};
