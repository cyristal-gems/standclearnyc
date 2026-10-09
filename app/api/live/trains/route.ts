export const maxDuration=30;
import {getTrains} from "../../../../lib/mta/trains";

export async function GET() {
  const data = await getTrains();
  return Response.json(data, {status: data.error ? 503 : 200, headers: {"Cache-Control": "no-store"}});
}
