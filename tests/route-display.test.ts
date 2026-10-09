import {expect,test} from "vitest";
import {routeSymbol,routeLabel,isDiamondRoute,routeColor,formatRouteText} from "../lib/mta/route-display";
test("public express symbols preserve the distinction from regular service",()=>{
 for(const [id,symbol] of [["FX","F"],["6X","6"],["7X","7"]]){expect(routeSymbol(id)).toBe(symbol);expect(isDiamondRoute(id)).toBe(true);expect(isDiamondRoute(symbol)).toBe(false);expect(routeLabel(id)).toContain("Express");expect(routeColor(id)).toBe(routeColor(symbol));}
});
test("all three independent shuttle identifiers display S",()=>{
 for(const id of ["H","GS","FS"]){expect(routeSymbol(id)).toBe("S");expect(isDiamondRoute(id)).toBe(false);expect(routeColor(id)).toBe("#808183");}
 expect(formatRouteText("[H] replaces [FX] alongside [6X] and [7X]")).toBe("[S] replaces [◇ F Express] alongside [◇ 6 Express] and [◇ 7 Express]");
});
