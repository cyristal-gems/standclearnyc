import GtfsRealtimeBindings from "gtfs-realtime-bindings";

export const TRAIN_FEEDS = ["gtfs", "gtfs-ace", "gtfs-bdfm", "gtfs-g", "gtfs-jz", "gtfs-l", "gtfs-nqrw", "gtfs-si"];
export const trainFeedUrl = (id: string) => `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2F${id}`;
export type Train = {
  id: string; route: string; stop: string; direction: string;
  status: "At station" | "Approaching" | "In transit";
  destination: string; timestamp: number; feedTimestamp: number;
  awaitingUpdate: boolean; delayed: boolean;
};
export type Arrival = {
  trainId: string; route: string; stop: string; direction: string;
  destination: string; time: number; awaitingUpdate: boolean; delayed: boolean;
};
export type TrainData = {
  checkedAt: string; trains: Train[]; arrivals: Arrival[];
  feeds: {id: string; available: boolean; timestamp: number | null}[];
  partial: boolean; error?: string;
};
export const parentStop = (stop: string) => stop.replace(/[NS]$/, "");
const tripKey = (trip: {tripId?: string | null; startDate?: string | null; routeId?: string | null}) =>
  `${trip.startDate ?? ""}:${trip.routeId ?? ""}:${trip.tripId ?? ""}`;

export function decodeTrains(bytes: Uint8Array, now = Date.now() / 1000) {
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(bytes);
  const timestamp = Number(feed.header.timestamp ?? 0);
  if (!timestamp || now - timestamp > 300 || timestamp - now > 60) throw new Error("Stale train feed");
  const updates = new Map(feed.entity.flatMap(entity => entity.tripUpdate?.trip ? [[tripKey(entity.tripUpdate.trip), entity.tripUpdate] as const] : []));
  const vehicles = new Map(feed.entity.flatMap(entity => entity.vehicle?.trip ? [[tripKey(entity.vehicle.trip), entity.vehicle] as const] : []));
  const delayed = new Set(feed.entity.flatMap(entity => entity.alert?.informedEntity?.flatMap(selector => selector.trip ? [tripKey(selector.trip)] : []) ?? []));
  const trains: Train[] = []; const arrivals: Arrival[] = [];
  for (const [id, update] of updates) {
    const route = update.trip?.routeId;
    if (!route || update.trip?.scheduleRelationship === 3) continue;
    const vehicle = vehicles.get(id);
    const stops = (update.stopTimeUpdate ?? []).filter(stop => stop.stopId && stop.scheduleRelationship !== 1);
    const destination = parentStop(stops.at(-1)?.stopId ?? "");
    const awaitingUpdate = Boolean(vehicle?.timestamp && now - Number(vehicle.timestamp) > 90);
    for (const stop of stops) {
      const arrival = Number(stop.arrival?.time ?? stop.departure?.time ?? 0);
      const departure = Number(stop.departure?.time ?? arrival);
      const time = arrival < now && departure >= now ? departure : arrival;
      if (!Number.isFinite(time) || time < now || time > now + 3600) continue;
      arrivals.push({trainId: id, route, stop: parentStop(stop.stopId!), direction: stop.stopId!.slice(-1), destination, time, awaitingUpdate, delayed: delayed.has(id)});
    }
    if (!vehicle?.stopId) continue;
    trains.push({id, route, stop: parentStop(vehicle.stopId), direction: vehicle.stopId.slice(-1),
      status: vehicle.currentStatus === 1 ? "At station" : vehicle.currentStatus === 0 ? "Approaching" : "In transit",
      destination, timestamp: Number(vehicle.timestamp ?? timestamp), feedTimestamp: timestamp, awaitingUpdate, delayed: delayed.has(id)});
  }
  return {timestamp, trains, arrivals};
}

export async function getTrains(): Promise<TrainData> {
  const results = await Promise.allSettled(TRAIN_FEEDS.map(async id => {
    const response = await fetch(trainFeedUrl(id), {next: {revalidate: 20}, signal: AbortSignal.timeout(8000)});
    if (!response.ok) throw new Error("Train feed unavailable");
    return {id, ...decodeTrains(new Uint8Array(await response.arrayBuffer()))};
  }));
  const trains = new Map<string, Train>(); const arrivals = new Map<string, Arrival>();
  const feeds = results.map((result, index) => {
    if (result.status === "rejected") return {id: TRAIN_FEEDS[index], available: false, timestamp: null};
    for (const train of result.value.trains) trains.set(train.id, train);
    for (const arrival of result.value.arrivals) arrivals.set(`${arrival.trainId}:${arrival.stop}:${arrival.direction}`, arrival);
    return {id: result.value.id, available: true, timestamp: result.value.timestamp};
  });
  return {checkedAt: new Date().toISOString(), trains: [...trains.values()], arrivals: [...arrivals.values()].sort((a,b) => a.time-b.time), feeds, partial: feeds.some(feed => !feed.available),
    ...feeds.every(feed => !feed.available) ? {error: "Live MTA trains are unavailable or stale"} : {}};
}
