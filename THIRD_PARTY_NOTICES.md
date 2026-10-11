# Third-Party Notices

## Ownership of this project

Copyright © 2026 Cyristal Joseph. All rights reserved.

The original application code and original title artwork belong to Cyristal Joseph and are not offered under MIT or any other open-source license.

## How third-party licenses apply

This project uses software, fonts, data, and other materials provided by third parties. Those materials retain their own copyrights, licenses, and terms.

**An MIT entry below applies only to the third-party package named in that row. It does not grant an MIT license to this project's original code or artwork.** The same distinction applies to Apache, BSD, and other third-party licenses.

This document records attribution and source information. It does not replace the full licenses included with third-party materials or grant additional rights to them.

## Fonts, artwork, and data sources

| Third-party material | Applicable license or terms | Attribution and usage notes |
| --- | --- | --- |
| Permanent Marker font | Apache License 2.0 | Copyright 2010 Font Diner, Inc. The original license is preserved in [public/fonts/LICENSE.txt](public/fonts/LICENSE.txt). |
| MTA route, station, and live data | MTA data terms | See [MTA developer resources](https://www.mta.info/developers) and the linked feed terms. Access to data does not grant a license to MTA artwork or trademarks. |
| MTA logos, map artwork, and official symbols | Separate MTA permission required | This project does not assert a license to official MTA artwork. Custom route badges do not grant permission to use MTA intellectual property. |
| OpenStreetMap basemap data | ODbL 1.0 | See [OpenStreetMap copyright and attribution](https://www.openstreetmap.org/copyright). Attribution remains visible on the map. Tile service policies also apply. |
| RIOC tram information and cameras | External source; no redistribution permission granted by this project | See [RIOC tram information](https://www.rioc.ny.gov/community/transportation/tram). Cameras are linked, not copied or rebroadcast. The tram geometry is an approximate original terminal-to-terminal reference. |

## Third-party JavaScript packages

The following licenses belong to the listed dependencies, **not to Stand Clear's original code**. Full package licenses and copyright notices remain in their distributions. This inventory covers direct JavaScript dependencies; transitive dependencies and other software retain their own licenses as well.

| Package | Declared license |
| --- | --- |
| gtfs-realtime-bindings | See package distribution |
| maplibre-gl | BSD-3-Clause |
| next | MIT |
| pg | MIT |
| react | MIT |
| react-dom | MIT |
| @tailwindcss/postcss | MIT |
| @types/node | MIT |
| @types/pg | MIT |
| @types/react | MIT |
| @types/react-dom | MIT |
| eslint | MIT |
| eslint-config-next | MIT |
| tailwindcss | MIT |
| typescript | Apache-2.0 |
| vitest | MIT |


## Tram departure-time source

Scheduled tram departure times come from the [Roosevelt Island Transit endpoint](https://transit.rooseveltisland.app/api/transit), accessed October 9, 2026.

The source marks its tram records as `isRealtime=false`. The app uses only `direction` and `scheduledTime`, credits the provider, and rejects stale responses. It does not copy the provider's interface or present this endpoint as an official RIOC live feed. No long-term API availability or service-level guarantee is asserted.
