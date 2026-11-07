import { Flight, Runway, SeparationRule, SchedulingWeights, ConflictAlert } from '../types';

/**
 * Standard Max-Heap Priority Queue implementation for O(log N) operations.
 */
export class PriorityQueue<T> {
  private heap: T[] = [];
  private comparator: (a: T, b: T) => number;

  constructor(comparator: (a: T, b: T) => number) {
    this.comparator = comparator;
  }

  public size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public peek(): T | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  public push(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  public pop(): T | null {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.bubbleDown(0);
    }
    return top;
  }

  public toSortedArray(): T[] {
    const copy = [...this.heap];
    return copy.sort(this.comparator);
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      // comparator(parent, child) > 0 means child has higher priority than parent
      if (this.comparator(this.heap[index], this.heap[parentIndex]) < 0) {
        [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let candidate = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      if (left < length && this.comparator(this.heap[left], this.heap[candidate]) < 0) {
        candidate = left;
      }
      if (right < length && this.comparator(this.heap[right], this.heap[candidate]) < 0) {
        candidate = right;
      }

      if (candidate !== index) {
        [this.heap[index], this.heap[candidate]] = [this.heap[candidate], this.heap[index]];
        index = candidate;
      } else {
        break;
      }
    }
  }
}

/**
 * Calculates priority score and detailed explanation for a flight
 * Formula: Score = α × WaitTime + β × (100 / max(Fuel, 5)) + γ_class + EmergencySurge
 */
export function calculateFlightPriority(
  flight: Flight,
  weights: SchedulingWeights
): { score: number; reason: string; priorityClass: Flight['priority'] } {
  let priorityClass: Flight['priority'] = flight.priority;

  // Auto-promote to P1 if emergency or critical fuel < 15%
  let emergencySurge = 0;
  if (flight.emergencyType !== 'none' || flight.fuelPercent <= 15) {
    priorityClass = 'P1';
    emergencySurge = 450;
    if (flight.emergencyType === 'engine_failure') emergencySurge += 250;
    if (flight.emergencyType === 'mayday') emergencySurge += 350;
    if (flight.emergencyType === 'medical') emergencySurge += 200;
  } else if (flight.operation === 'Landing') {
    priorityClass = 'P2';
  } else {
    priorityClass = 'P3';
  }

  // Waiting time term
  const waitTerm = weights.alpha * Math.max(0, flight.waitingTime);

  // Fuel urgency term (higher urgency as fuel approaches 0)
  const safeFuel = Math.max(5, flight.fuelPercent);
  const fuelUrgency = (100 / safeFuel);
  const fuelTerm = weights.beta * (fuelUrgency / 2.0);

  // Class base weight
  let classBase = weights.gammaP3;
  if (priorityClass === 'P1') classBase = weights.gammaP1;
  else if (priorityClass === 'P2') classBase = weights.gammaP2;

  const totalScore = parseFloat((waitTerm + fuelTerm + classBase + emergencySurge).toFixed(1));

  // Build descriptive reason
  let reason = '';
  if (priorityClass === 'P1') {
    const details = flight.emergencyDetails ? ` (${flight.emergencyDetails})` : '';
    reason = `P1 Emergency Preemption${details} | Fuel: ${flight.fuelPercent}% | Base +${classBase + emergencySurge}`;
  } else if (priorityClass === 'P2') {
    if (flight.fuelPercent < 25) {
      reason = `P2 Inbound Landing | Low fuel warning (${flight.fuelPercent}%) | Wait: ${flight.waitingTime}m`;
    } else {
      reason = `P2 Scheduled Inbound Landing | Wait: ${flight.waitingTime}m | Fuel: ${flight.fuelPercent}%`;
    }
  } else {
    reason = `P3 Standard Departure Sequence | Wait: ${flight.waitingTime}m | Score: ${totalScore}`;
  }

  return { score: totalScore, reason, priorityClass };
}

/**
 * Find wake turbulence separation time in minutes between leader and follower
 */
export function getRequiredSeparation(
  leaderType: Flight['aircraftType'],
  followerType: Flight['aircraftType'],
  rules: SeparationRule[]
): { minutes: number; nm: number } {
  const rule = rules.find(r => r.leader === leaderType && r.follower === followerType);
  if (rule) {
    return { minutes: rule.separationMinutes, nm: rule.separationNm };
  }
  // Default fallback safe separation
  return { minutes: 2.5, nm: 5.0 };
}

/**
 * Format minutes (from midnight) into HH:MM string
 */
export function formatMinutesToTime(minutes: number): string {
  const normalized = Math.max(0, Math.floor(minutes)) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Parse HH:MM to minutes from midnight
 */
export function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return 870;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Core Automatic Runway Scheduling Engine with Priority Queue and Conflict Prevention
 */
export function runAutomatedScheduler(
  flights: Flight[],
  runways: Runway[],
  separationRules: SeparationRule[],
  weights: SchedulingWeights,
  currentSimTimeMinutes: number
): { scheduledFlights: Flight[]; updatedRunways: Runway[]; conflicts: ConflictAlert[] } {
  // 1. Recalculate priority scores for all flights
  const scoredFlights: Flight[] = flights.map(f => {
    // If flight is already completed or diverted, preserve it
    if (f.status === 'Completed' || f.status === 'Diverted') {
      return f;
    }

    const { score, reason, priorityClass } = calculateFlightPriority(f, weights);
    return {
      ...f,
      priorityScore: score,
      priorityReason: reason,
      priority: priorityClass
    };
  });

  // Separate active/completed flights
  const activeFlights = scoredFlights.filter(f => f.status !== 'Completed' && f.status !== 'Diverted');
  const finishedFlights = scoredFlights.filter(f => f.status === 'Completed' || f.status === 'Diverted');

  // 2. Identify flights that are already physically on a runway (CANNOT BE PREEMPTED)
  const lockedOnRunwayFlights = activeFlights.filter(f => f.status === 'On Runway');

  // 3. Build Priority Queue for candidate flights that need runway scheduling
  // Sort descending by priorityScore (highest score pops first)
  const pq = new PriorityQueue<Flight>((a, b) => {
    // Higher score comes first (negative for max heap)
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    // Tie-breaker: earlier ETA comes first
    return a.estimatedTimeMinutes - b.estimatedTimeMinutes;
  });

  // Add all pending flights to Priority Queue (excluding already locked on runway)
  activeFlights
    .filter(f => f.status !== 'On Runway')
    .forEach(f => pq.push(f));

  // Ordered list of flights from Priority Queue
  const priorityOrdered = pq.toSortedArray();

  // 4. Map runway timelines to track scheduled slots
  // Runway id -> Array of { flightId, startTime, endTime, aircraftType, isLocked }
  interface RunwaySlot {
    flightId: string;
    startTime: number;
    endTime: number;
    aircraftType: Flight['aircraftType'];
    isLocked: boolean;
  }

  const runwayTimelines: Record<string, RunwaySlot[]> = {};
  runways.forEach(r => {
    runwayTimelines[r.id] = [];
  });

  // Seed runway timelines with flights currently locked on runway
  lockedOnRunwayFlights.forEach(f => {
    if (f.assignedRunwayId && runwayTimelines[f.assignedRunwayId]) {
      const start = f.scheduledTimeMinutes || currentSimTimeMinutes;
      const end = start + (f.durationMinutes || 3.0);
      runwayTimelines[f.assignedRunwayId].push({
        flightId: f.id,
        startTime: start,
        endTime: end,
        aircraftType: f.aircraftType,
        isLocked: true
      });
    }
  });

  const scheduledFlightsMap: Record<string, Flight> = {};
  lockedOnRunwayFlights.forEach(f => {
    scheduledFlightsMap[f.id] = f;
  });

  // Operational runways (exclude maintenance)
  const availableRunways = runways.filter(r => r.status !== 'Maintenance');

  // Helper to check if a runway can accept a flight's operation & weight
  const isRunwayCompatible = (rwy: Runway, flight: Flight): boolean => {
    if (rwy.status === 'Maintenance') return false;
    if (flight.aircraftType === 'Heavy' && rwy.lengthMeters < 3400) return false;
    if (flight.operation === 'Landing' && rwy.supportedOperations === 'Takeoff Only') return false;
    if (flight.operation === 'Takeoff' && rwy.supportedOperations === 'Landing Only') return false;
    return true;
  };

  // 5. Schedule each flight from the priority queue into the best runway slot
  priorityOrdered.forEach(flight => {
    // Determine compatible runways
    let candidateRunways = availableRunways.filter(r => isRunwayCompatible(r, flight));
    
    // If no candidate (e.g. all restricted), fallback to any non-maintenance runway
    if (candidateRunways.length === 0) {
      candidateRunways = availableRunways.length > 0 ? [availableRunways[0]] : [runways[0]];
    }

    // If emergency, prioritize the longest runway available (e.g. 09L or 09R)
    if (flight.priority === 'P1') {
      candidateRunways.sort((a, b) => b.lengthMeters - a.lengthMeters);
    }

    let bestRunwayId = candidateRunways[0]?.id || 'RWY-09L';
    let earliestFeasibleStart = Infinity;

    // For each candidate runway, test slot availability respecting separation
    candidateRunways.forEach(rwy => {
      const timeline = runwayTimelines[rwy.id] || [];
      const baseEarliestTime = Math.max(currentSimTimeMinutes, flight.estimatedTimeMinutes);
      
      let candidateStart = baseEarliestTime;

      // Ensure we don't start before runway becomes available from maintenance or prior locked aircraft
      timeline.forEach(slot => {
        const sep = getRequiredSeparation(slot.aircraftType, flight.aircraftType, separationRules);
        const requiredStart = slot.endTime + sep.minutes;
        if (candidateStart < requiredStart) {
          candidateStart = requiredStart;
        }
      });

      if (candidateStart < earliestFeasibleStart) {
        earliestFeasibleStart = candidateStart;
        bestRunwayId = rwy.id;
      }
    });

    const finalRunwayId = bestRunwayId;
    const finalStart = earliestFeasibleStart === Infinity ? Math.max(currentSimTimeMinutes, flight.estimatedTimeMinutes) : earliestFeasibleStart;
    const finalDuration = flight.durationMinutes || 3.0;
    const finalEnd = finalStart + finalDuration;

    // Register into timeline
    if (!runwayTimelines[finalRunwayId]) {
      runwayTimelines[finalRunwayId] = [];
    }
    runwayTimelines[finalRunwayId].push({
      flightId: flight.id,
      startTime: finalStart,
      endTime: finalEnd,
      aircraftType: flight.aircraftType,
      isLocked: false
    });

    // Update flight assignment
    let newStatus = flight.status;
    if (flight.status === 'Approaching' || flight.status === 'Holding') {
      // If start time is within 3 minutes of current time, clear it
      if (finalStart - currentSimTimeMinutes <= 4) {
        newStatus = 'Cleared';
      }
    } else if (flight.status === 'Queued') {
      if (finalStart - currentSimTimeMinutes <= 3) {
        newStatus = 'Cleared';
      }
    }

    scheduledFlightsMap[flight.id] = {
      ...flight,
      assignedRunwayId: finalRunwayId,
      scheduledTimeMinutes: parseFloat(finalStart.toFixed(1)),
      status: newStatus
    };
  });

  // Recombine all flights in clean order
  const allUpdatedFlights = [
    ...Object.values(scheduledFlightsMap),
    ...finishedFlights
  ];

  // 6. Update Runway stats (current flight, next flight, utilization)
  const updatedRunways = runways.map(rwy => {
    const slots = (runwayTimelines[rwy.id] || []).sort((a, b) => a.startTime - b.startTime);
    const activeSlot = slots.find(s => s.startTime <= currentSimTimeMinutes && s.endTime >= currentSimTimeMinutes);
    const nextSlot = slots.find(s => s.startTime > currentSimTimeMinutes);

    let status = rwy.status;
    if (rwy.status !== 'Maintenance') {
      status = activeSlot ? 'Occupied' : 'Available';
    }

    const currentFlightId = activeSlot ? activeSlot.flightId : null;
    const nextFlightId = nextSlot ? nextSlot.flightId : null;

    // Calculate utilization percentage over the next 60 minutes
    const windowStart = currentSimTimeMinutes;
    const windowEnd = currentSimTimeMinutes + 60;
    let occupiedMinutes = 0;
    slots.forEach(s => {
      const overlapStart = Math.max(windowStart, s.startTime);
      const overlapEnd = Math.min(windowEnd, s.endTime);
      if (overlapEnd > overlapStart) {
        occupiedMinutes += (overlapEnd - overlapStart);
      }
    });

    const calculatedUtil = Math.min(100, Math.round((occupiedMinutes / 60) * 100));

    return {
      ...rwy,
      status,
      currentFlightId,
      nextFlightId,
      availableAtMinutes: activeSlot ? activeSlot.endTime : currentSimTimeMinutes,
      utilizationPercent: calculatedUtil
    };
  });

  // 7. Live Runway Conflict Detection Engine
  const conflicts: ConflictAlert[] = [];
  runways.forEach(rwy => {
    const rwyFlights = allUpdatedFlights
      .filter(f => f.assignedRunwayId === rwy.id && f.scheduledTimeMinutes !== null && f.status !== 'Completed' && f.status !== 'Diverted')
      .sort((a, b) => (a.scheduledTimeMinutes || 0) - (b.scheduledTimeMinutes || 0));

    for (let i = 0; i < rwyFlights.length - 1; i++) {
      const leader = rwyFlights[i];
      const follower = rwyFlights[i + 1];

      const leaderStart = leader.scheduledTimeMinutes!;
      const leaderEnd = leaderStart + (leader.durationMinutes || 3.0);
      const followerStart = follower.scheduledTimeMinutes!;

      const actualGap = followerStart - leaderEnd;
      const required = getRequiredSeparation(leader.aircraftType, follower.aircraftType, separationRules);

      if (actualGap < required.minutes) {
        const isOverlap = followerStart < leaderEnd;
        conflicts.push({
          id: `conflict-${rwy.id}-${leader.id}-${follower.id}`,
          runwayId: rwy.id,
          runwayName: rwy.name,
          flightAId: leader.id,
          flightAName: leader.flightNumber,
          flightBId: follower.id,
          flightBName: follower.flightNumber,
          scheduledTimeA: leaderStart,
          scheduledTimeB: followerStart,
          actualGapMinutes: parseFloat(actualGap.toFixed(1)),
          requiredGapMinutes: required.minutes,
          severity: isOverlap ? 'Critical' : 'Warning',
          description: isOverlap
            ? `Runway overlap! ${follower.flightNumber} (${follower.aircraftType}) scheduled before ${leader.flightNumber} (${leader.aircraftType}) vacates.`
            : `Wake turbulence buffer breached: actual gap ${actualGap.toFixed(1)}m < required ${required.minutes}m (${required.nm} NM).`
        });
      }
    }
  });

  return {
    scheduledFlights: allUpdatedFlights,
    updatedRunways,
    conflicts
  };
}
