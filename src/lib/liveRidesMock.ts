// Illustrative mock data for live rides. NOT a backend contract: values are
// fabricated for development/demo and must not be treated as real ride state.

import type { LiveRide, LiveRideStatus, RideType } from "./liveRides";
import {
  deterministicChoice,
  deterministicNumber,
  formatMoneyTZS,
  haversineKm,
  LIVE_RIDE_LOCATIONS,
  stableHash,
} from "./liveRides";

const STORAGE_KEY = "raut_live_rides_v1";

const DRIVER_POOL = [
  {
    id: "DRV-1001",
    name: "John Kimaro",
    phone: "+255 712 345 678",
    rating: 4.8,
    ratingCount: 234,
  },
  {
    id: "DRV-1002",
    name: "Grace Mwakalila",
    phone: "+255 715 234 567",
    rating: 4.9,
    ratingCount: 187,
  },
  {
    id: "DRV-1003",
    name: "Peter Mushi",
    phone: "+255 718 345 789",
    rating: 4.7,
    ratingCount: 312,
  },
  {
    id: "DRV-1004",
    name: "Amina Juma",
    phone: "+255 713 456 890",
    rating: 4.6,
    ratingCount: 156,
  },
  {
    id: "DRV-1005",
    name: "David John",
    phone: "+255 719 567 123",
    rating: 4.9,
    ratingCount: 401,
  },
  {
    id: "DRV-1006",
    name: "Salma Rashid",
    phone: "+255 714 678 901",
    rating: 4.5,
    ratingCount: 98,
  },
  {
    id: "DRV-1007",
    name: "Chris Mwakipesile",
    phone: "+255 717 789 012",
    rating: 4.7,
    ratingCount: 214,
  },
  {
    id: "DRV-1008",
    name: "Neema Khalfan",
    phone: "+255 716 890 123",
    rating: 4.8,
    ratingCount: 123,
  },
];

const CUSTOMER_POOL = [
  {
    id: "CUS-2001",
    name: "Mary Shayo",
    phone: "+255 752 345 678",
    rating: 4.9,
    ratingCount: 89,
  },
  {
    id: "CUS-2002",
    name: "Alice Mrosso",
    phone: "+255 755 234 567",
    rating: 4.7,
    ratingCount: 64,
  },
  {
    id: "CUS-2003",
    name: "Bob Byaruhanga",
    phone: "+255 758 345 789",
    rating: 4.5,
    ratingCount: 77,
  },
  {
    id: "CUS-2004",
    name: "Carol Selemani",
    phone: "+255 753 456 890",
    rating: 4.8,
    ratingCount: 53,
  },
  {
    id: "CUS-2005",
    name: "Hassan Mrutu",
    phone: "+255 759 567 123",
    rating: 4.6,
    ratingCount: 91,
  },
  {
    id: "CUS-2006",
    name: "Fatma Hassan",
    phone: "+255 754 678 901",
    rating: 4.9,
    ratingCount: 45,
  },
];

const VEHICLES = [
  { make: "Toyota", model: "Vitz", plate: "ABC-1234" },
  { make: "Toyota", model: "Rumion", plate: "DEF-5678" },
  { make: "Nissan", model: "Sunny", plate: "GHI-9012" },
  { make: "Toyota", model: "Allion", plate: "JKL-3456" },
  { make: "Honda", model: "Fit", plate: "MNO-7890" },
];

const STATUS_ORDER: LiveRideStatus[] = [
  "accepted",
  "arrived",
  "picked_up",
  "near_dropoff",
  "completed",
];

function randomDriver(seed: string) {
  return deterministicChoice(seed, DRIVER_POOL);
}

function randomCustomer(seed: string) {
  return deterministicChoice(seed, CUSTOMER_POOL);
}

function randomVehicle(seed: string) {
  return deterministicChoice(seed, VEHICLES);
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export function generateMockLiveRide(rideId: string): LiveRide {
  const seed = stableHash(rideId);
  const typeSeed = stableHash(rideId + "t");
  const driverSeed = stableHash(rideId + "d");
  const customerSeed = stableHash(rideId + "c");
  const vehicleSeed = stableHash(rideId + "v");

  const type: RideType = deterministicChoice(rideId, [
    "private",
    "duo_host",
    "duo_declared",
  ]);
  const driver = randomDriver(String(driverSeed));
  const vehicle = randomVehicle(String(vehicleSeed));
  const pickup = deterministicChoice(rideId, LIVE_RIDE_LOCATIONS);
  const dropoff = deterministicChoice(
    rideId,
    LIVE_RIDE_LOCATIONS.filter((l) => l.name !== pickup.name),
  );
  const distanceKm = deterministicNumber(rideId, 3, 25) / 10;
  const etaMin = Math.max(2, Math.round(distanceKm / 0.6));
  const baseFare = 2000;
  const distanceCharge = Math.round(distanceKm * 500);
  const timeCharge = Math.round(etaMin * 100);
  const platformPct = 20;
  const subtotal = baseFare + distanceCharge + timeCharge;
  const platformFee = Math.round((subtotal * platformPct) / 100);
  const total = baseFare + distanceCharge + timeCharge + platformFee;

  const rideStarts = 10 + (seed % 300);
  const statusIndex = deterministicNumber(rideId, 0, STATUS_ORDER.length - 1);
  const status: LiveRideStatus = STATUS_ORDER[statusIndex];
  const statusChangedAt = minutesAgo(1 + (seed % 120));

  const pickupLat =
    pickup.lat + deterministicNumber(rideId, -500, 500) / 100000;
  const pickupLng =
    pickup.lng + deterministicNumber(rideId, -500, 500) / 100000;
  const dropoffLat =
    dropoff.lat + deterministicNumber(rideId, -500, 500) / 100000;
  const dropoffLng =
    dropoff.lng + deterministicNumber(rideId, -500, 500) / 100000;

  const progress = statusIndex / (STATUS_ORDER.length - 1);
  const driverLat =
    pickupLat +
    (dropoffLat - pickupLat) * progress +
    deterministicNumber(rideId, -300, 300) / 100000;
  const driverLng =
    pickupLng +
    (dropoffLng - pickupLng) * progress +
    deterministicNumber(rideId, -300, 300) / 100000;

  const firstCustomer = randomCustomer(String(customerSeed));
  const customers =
    type === "private"
      ? [firstCustomer]
      : [
          firstCustomer,
          deterministicChoice(
            customerSeed + "b",
            CUSTOMER_POOL.filter((c) => c.id !== firstCustomer.id),
          ),
        ];

  return {
    id: rideId,
    displayId: `#RD-${String(rideId).replace(/-/g, "").slice(0, 6).toUpperCase()}`,
    type,
    seats: type === "private" ? 1 : deterministicNumber(rideId, 2, 3),
    status,
    statusChangedAt,
    requestedAt: minutesAgo(rideStarts),
    driver: {
      ...driver,
      vehicle: `${vehicle.make} ${vehicle.model}`,
      plate: vehicle.plate,
    },
    customers,
    position: { lat: driverLat, lng: driverLng, heading: 0, speed: 0 },
    pickup: { name: pickup.name, lat: pickupLat, lng: pickupLng },
    dropoff: { name: dropoff.name, lat: dropoffLat, lng: dropoffLng },
    distanceKm: Math.round(distanceKm * 10) / 10,
    etaMin,
    fare: {
      total,
      base: baseFare,
      distance: distanceCharge,
      time: timeCharge,
      platformPct,
      platformFee,
    },
    issues: {
      longWait: status === "arrived" && deterministicNumber(rideId, 0, 10) < 3,
      offRoute: deterministicNumber(rideId, 0, 10) < 2,
      delayed: deterministicNumber(rideId, 0, 10) < 2,
      flagged: false,
    },
    hasIssue: false,
  };
}

const rideStore = new Map<string, LiveRide>();
const cancelledIds = new Set<string>();

export function getMockLiveRides(count = 40): LiveRide[] {
  const rides: LiveRide[] = [];
  for (let i = 0; i < count; i++) {
    const rideId = `LRD-${stableHash(String(i)).toString(16).toUpperCase().slice(0, 6)}`;
    const ride = generateMockLiveRide(rideId);
    if (!cancelledIds.has(rideId)) {
      const existing = rideStore.get(rideId);
      rides.push(existing ?? ride);
      if (!existing) rideStore.set(rideId, ride);
    }
  }
  return rides.sort(
    (a, b) =>
      new Date(b.statusChangedAt).getTime() -
      new Date(a.statusChangedAt).getTime(),
  );
}

let freshRideSequence = 0;

export function createMockLiveRide(): LiveRide {
  freshRideSequence += 1;
  const rideId = `LRD-${Date.now().toString(36).toUpperCase()}${freshRideSequence}`;
  const ride = generateMockLiveRide(rideId);
  rideStore.set(rideId, ride);
  return ride;
}

export function getMockLiveRide(rideId: string): LiveRide | undefined {
  const existing = rideStore.get(rideId);
  if (existing) return existing;
  const ride = generateMockLiveRide(rideId);
  rideStore.set(rideId, ride);
  return ride;
}

function saveOverride(
  type: string,
  rideId: string,
  payload: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const data: Record<string, any> = raw ? JSON.parse(raw) : {};
    if (!data[type]) data[type] = {};
    data[type][rideId] = payload;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable; keep in-memory only
  }
}

function loadOverride(
  type: string,
  rideId: string,
): Record<string, unknown> | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const data: Record<string, any> = JSON.parse(raw);
    return data[type]?.[rideId];
  } catch {
    return undefined;
  }
}

export function cancelMockLiveRide(
  rideId: string,
  reason: string,
  refund: "full" | "partial" | "none",
  partialPercent: number,
  penalizeDriver: boolean,
): LiveRide {
  const ride = getMockLiveRide(rideId);
  cancelledIds.add(rideId);
  const updated: LiveRide = {
    ...ride,
    status: "completed",
    statusChangedAt: new Date().toISOString(),
    removedAt: new Date().toISOString(),
  };
  rideStore.set(rideId, updated);
  saveOverride("cancel", rideId, {
    reason,
    refund,
    partialPercent,
    penalizeDriver,
  });
  return updated;
}

export function flagMockLiveRide(rideId: string, reason: string): LiveRide {
  const ride = getMockLiveRide(rideId);
  const updated: LiveRide = {
    ...ride,
    issues: { ...ride.issues, flagged: true },
    hasIssue: true,
  };
  rideStore.set(rideId, updated);
  saveOverride("flag", rideId, { reason });
  return updated;
}

export function addMockLiveRideNote(rideId: string, text: string): LiveRide {
  const ride = getMockLiveRide(rideId);
  const note: any = {
    id: `note-${Date.now()}`,
    text,
    createdAt: new Date().toISOString(),
  };
  const notes: any[] = [...((ride as any).notes ?? []), note];
  const updated: LiveRide = { ...ride, notes } as LiveRide;
  rideStore.set(rideId, updated);
  saveOverride("note", rideId, { text });
  return updated;
}

export function escalateMockLiveRide(rideId: string, note: string): LiveRide {
  const ride = getMockLiveRide(rideId);
  const updated: LiveRide = {
    ...ride,
    notes: [
      ...((ride as any).notes ?? []),
      {
        id: `esc-${Date.now()}`,
        text: `Escalated: ${note}`,
        createdAt: new Date().toISOString(),
      },
    ],
  } as LiveRide;
  rideStore.set(rideId, updated);
  saveOverride("escalate", rideId, { note });
  return updated;
}

export function overrideMockLiveRideFare(
  rideId: string,
  amount: number,
  reason: string,
): LiveRide {
  const ride = getMockLiveRide(rideId);
  const updated: LiveRide = {
    ...ride,
    fare: { ...ride.fare, total: Math.max(0, amount) },
  };
  rideStore.set(rideId, updated);
  saveOverride("overrideFare", rideId, { amount, reason });
  return updated;
}

export function getMockLiveRideHistory(
  rideId: string,
): Array<{ time: string; event: string; detail?: string }> {
  const ride = getMockLiveRide(rideId);
  const seed = stableHash(rideId);
  const events: Array<{ time: string; event: string; detail?: string }> = [
    {
      time: ride.requestedAt,
      event: "Ride requested",
      detail: `by ${ride.customers.map((c) => c.name).join(", ")}`,
    },
    { time: ride.statusChangedAt, event: `Status set to ${ride.status}` },
  ];
  const noteCount = deterministicNumber(rideId, 0, 3);
  for (let i = 0; i < noteCount; i++) {
    events.push({
      time: minutesAgo(20 + i * 10),
      event: "Position update",
      detail: `${deterministicNumber(rideId, 10, 60) / 10} km from dropoff`,
    });
  }
  return events.sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );
}

export function resetMockLiveRides(): void {
  rideStore.clear();
  cancelledIds.clear();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

export { STORAGE_KEY };
