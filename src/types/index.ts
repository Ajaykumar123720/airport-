export type FlightOperation = 'Landing' | 'Takeoff';
export type PriorityClass = 'P1' | 'P2' | 'P3';
export type AircraftWeightCategory = 'Heavy' | 'Medium' | 'Light';
export type FlightStatus = 'Approaching' | 'Holding' | 'Queued' | 'Cleared' | 'On Runway' | 'Completed' | 'Diverted';
export type EmergencyType = 'none' | 'low_fuel' | 'engine_failure' | 'medical' | 'mayday';

export interface Flight {
  id: string; // e.g., 'AA-104'
  callsign: string; // e.g., 'AAL104'
  airline: string; // e.g., 'American Airlines'
  aircraftName: string; // e.g., 'Boeing 777-300ER'
  aircraftType: AircraftWeightCategory; // 'Heavy', 'Medium', 'Light'
  flightNumber: string; // e.g., 'AA 104'
  origin: string; // e.g., 'JFK'
  destination: string; // e.g., 'LAX'
  operation: FlightOperation; // 'Landing' | 'Takeoff'
  fuelPercent: number; // 0 - 100
  estimatedTimeMinutes: number; // Minutes from simulation epoch (e.g. 14:30 = 870)
  scheduledTimeMinutes: number | null; // Scheduled slot time in minutes
  assignedRunwayId: string | null; // e.g. 'RWY-09L'
  priority: PriorityClass;
  emergencyType: EmergencyType;
  emergencyDetails?: string;
  waitingTime: number; // Minutes in queue / holding
  priorityScore: number; // Calculated by engine
  priorityReason: string; // Explanation of score
  status: FlightStatus;
  durationMinutes: number; // Runway occupancy duration (typically 2-4 mins)
  speedKnots: number;
  altitudeFt: number;
  distanceNm: number; // Distance to touchdown/runway threshold
  gate?: string;
}

export type RunwayStatus = 'Available' | 'Occupied' | 'Maintenance';

export interface Runway {
  id: string; // e.g. 'RWY-09L'
  name: string; // e.g. '09L/27R'
  lengthMeters: number; // e.g. 4000
  headingDeg: number; // e.g. 90
  status: RunwayStatus;
  supportedOperations: 'Both' | 'Landing Only' | 'Takeoff Only';
  currentFlightId: string | null;
  nextFlightId: string | null;
  availableAtMinutes: number;
  utilizationPercent: number;
  ilsCategory: string; // 'Cat III'
  maintenanceReason?: string;
}

export interface SeparationRule {
  leader: AircraftWeightCategory;
  follower: AircraftWeightCategory;
  separationMinutes: number; // e.g. 2.5 minutes
  separationNm: number; // e.g. 5 NM
}

export interface SchedulingWeights {
  alpha: number; // Wait time factor (default 1.5)
  beta: number; // Fuel urgency factor (default 80.0)
  gammaP1: number; // P1 Emergency base weight (default 500)
  gammaP2: number; // P2 Landing base weight (default 60)
  gammaP3: number; // P3 Takeoff base weight (default 15)
}

export interface ConflictAlert {
  id: string;
  runwayId: string;
  runwayName: string;
  flightAId: string;
  flightAName: string;
  flightBId: string;
  flightBName: string;
  scheduledTimeA: number;
  scheduledTimeB: number;
  actualGapMinutes: number;
  requiredGapMinutes: number;
  severity: 'Critical' | 'Warning';
  description: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string; // HH:MM:SS
  category: 'EMERGENCY' | 'SCHEDULE' | 'TAKEOFF' | 'LANDING' | 'SAFETY' | 'RUNWAY';
  message: string;
  flightId?: string;
  badgeType: 'emergency' | 'landing' | 'takeoff' | 'safety' | 'system';
}

export type ActiveTab = 
  | 'dashboard'
  | 'flights'
  | 'runways'
  | 'queue'
  | 'gantt'
  | 'emergency'
  | 'safety'
  | 'analytics'
  | 'architecture'
  | 'settings';
