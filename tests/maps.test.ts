import { expect, test } from "vitest";
import { officialMaps } from "../lib/mta/maps";
test("service modes use distinct official MTA sources",()=>{expect(officialMaps.day).not.toBe(officialMaps.night);for(const url of Object.values(officialMaps))expect(new URL(url).hostname).toBe("www.mta.info")});
