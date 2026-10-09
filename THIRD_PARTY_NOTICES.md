# Licenses and source notices

Copyright © 2026 Cyristal Joseph. Original code and title artwork are not offered under an open-source license. Third-party fonts, data, artwork and dependencies retain their own rights and terms.

| Item | License or terms | Scope |
| --- | --- | --- |
| Original application code and title SVG | No open-source license; rights retained | Copyright Cyristal Joseph |
| Permanent Marker font | Apache License 2.0; copyright 2010 Font Diner, Inc. | public/fonts/LICENSE.txt; preserved original license |
| User-supplied train.webp and derived train-still.png | Third-party artwork; no license asserted | Supplied by the project owner, who reports finding it through Google Images. No redistribution license is granted by this project. |
| MTA route, station and live data | MTA data terms | https://www.mta.info/developers and its linked feed terms. Free data access is not an artwork or trademark license. |
| MTA logos, map artwork and official symbols | Separate MTA permission required | No official artwork license is asserted. Custom route badges are not a grant to use MTA intellectual property. |
| OpenStreetMap basemap data | ODbL 1.0 | https://www.openstreetmap.org/copyright; map attribution remains visible. Tile service policies also apply. |
| RIOC tram information and cameras | External source, no redistribution grant | https://www.rioc.ny.gov/community/transportation/tram. Cameras are linked, not copied or rebroadcast. Tram geometry is an approximate original terminal-to-terminal reference. |
| Installed software dependencies | Each package's own license | Package licenses and copyright notices remain in installed distributions; see inventory below. |

## Direct JavaScript dependency inventory

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

Tram departure times: public Roosevelt Island Transit endpoint at https://transit.rooseveltisland.app/api/transit, accessed October 9, 2026. Its tram records are explicitly marked isRealtime=false. The app uses only direction and scheduledTime, credits the provider, rejects stale responses, and does not copy its UI or assume an official RIOC live feed. No long-term API availability or service-level guarantee is asserted.
