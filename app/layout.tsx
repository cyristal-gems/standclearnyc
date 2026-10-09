import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Stand Clear of the Closing Doors, Please!", description: "Explore New York City subway routes, live train arrivals, service alerts, station accessibility, and ridership." };
export default function Layout({children}: {children: React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
