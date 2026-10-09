# Development and data notes

## Local setup
```sh
npm ci
cp .env.example .env.local
npm run dev
```
Open the displayed localhost URL. Production preview: `npm run build && npm start`. Node 22 or later recommended. React, Next.js App Router, strict TypeScript, Tailwind and MapLibre. The map and service feeds work without PostgreSQL. Browser preferences are stored locally; selected station IDs are shareable in the URL.

## Database and historical ingestion
Use Python 3.12+ and Neon PostgreSQL:
```sh
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL='postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require'
alembic upgrade head
python -m etl.jobs.ingest --days 30
python -m pytest etl/tests
```
Alembic/ETL read the shell environment, not `.env.local`. Next.js reads `.env.local`. Migration 0001 creates stations and source metadata; 0002 adds hourly ridership, indices, a daily view and a materialized hourly profile.

Station IDs are **complex IDs**, not GTFS platform IDs. GTFS parent stops are linked through the official complex metadata. Hourly source grain: station complex × local timestamp × payment method × fare category, with primary-key deduplication. Subway records are included; non-subway modes are excluded. Source timestamps are preserved as timezone-aware metadata; ridership timestamps remain source-local NYC wall time. Ambiguous repeated DST hours cannot be reconstructed from this source field and are not guessed.

Ingestion is transactional and protected by a PostgreSQL advisory lock. It validates fields and coordinates, checks unknown station IDs, skips unchanged rows, updates changed metrics, logs counts, refreshes the materialized view and records freshness only after success. Subsequent runs reread a seven-day correction window; older corrections need a separately scoped backfill. The initial load covers the most recent source 30 days, not the last 30 calendar days. Source pagination uses stable Socrata row IDs. Upstream data can change mid-run; production hardening should add version checks around extraction. Failed runs roll back and retain last-success freshness; the CLI records a failed status and check time in a separate transaction when the database is reachable. CI/job failure logs report the failed check.

## APIs
- `/api/health`: real database connectivity; 503 if unavailable.
- `/api/live/status?line=A`: normalized current and future GTFS-RT advisories with active-period flags, source timestamp and optional verdict. 20-second server fetch cache, 30-second browser refresh. Rejects feeds older than five minutes, never reports stale data as healthy. Train movement reports and arrival estimates use the separate endpoint below.
- `/api/stations?q=Times`: stored official station-complex search, validated limit/offset pagination, up to 500 rows per request.
- `/api/analytics/ridership?station=611`: stored daily counts, hourly profiles and latest-day station ranking. 60-second browser refresh. Reports missing database/data explicitly.

## Official sources
Verified October 3, 2026:
- Developer registry: https://www.mta.info/developers
- Regular subway GTFS: https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip
- Current subway alerts: https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts
- Station complexes: https://data.ny.gov/resource/5f5g-n3cz.json
- Hourly ridership beginning 2025: https://data.ny.gov/resource/5wq4-mkjj.json

Original map geometry comes directly from GTFS route shapes and parent-station coordinates. It is a geographic transit overlay, not a tracing of copyrighted MTA diagram artwork. No official map PDF or screenshot is bundled. OpenStreetMap provides base geography with attribution. The public tile service is suitable for this small preview; provision an appropriate tile provider for production traffic. MapLibre workers are copied to same-origin assets during dependency installation. Day/night patterns use representative weekday trips classified by their midpoint: 7 AM–7 PM for daytime and 1–4 AM for overnight. Rare overnight patterns below 25% of the most frequent pattern for a route/direction are excluded. This avoids marking an entire daytime trip as night service merely because one stop crosses a time boundary. MTA's current late-night map describes approximately 11 PM–5 AM; individual changeover times vary. The bundled snapshot is cross-checked against [MTA daytime](https://www.mta.info/map/5256) and [MTA late-night](https://www.mta.info/map/5336) maps. These views show typical schedules, with temporary changes handled through live alerts.

Neighbor relationships come from official trip stop sequences and terminal headsigns. Multiple patterns can produce different next stops; the panel labels these as scheduled variants. Alerts remain visible alongside the map; exact degraded-segment geometry is not inferred from general route alerts.

## SQL portfolio
Ten queries in `sql/analysis/` demonstrate joins, CTEs, window functions, calendar windows, rush-hour profiles, station ranking, borough totals and exploratory anomalies. Missing days are not zero-filled. Growth and anomaly outputs need coverage and seasonality review before making operational claims. Actual EXPLAIN ANALYZE measurements require a populated database and have not been invented.

## Continuous refresh and deployment
Deploy target: GitHub + Vercel + Neon. Import the repository in Vercel, set server-only DATABASE_URL, provision Neon, apply migrations and ingest. Set DATABASE_URL as a GitHub Actions secret. `.github/workflows/update-ridership.yml` runs daily at 09:17 UTC and supports manual runs. `.github/workflows/update-map.yml` refreshes the official schedule snapshot daily and commits changed generated assets so the connected Vercel project redeploys. These jobs become active only after this project is pushed to GitHub; no remote repository or production deployment has been created yet. Scheduled jobs are not used for rapid realtime updates.

The map snapshot is bundled for reliable initial loading. Daily schedule refresh requires GitHub Actions write permissions. Live and historical data refresh independently while the app is open. Pause browser polling while hidden to reduce unnecessary requests. No cron automation inside Codex is needed for app refresh.

## Environment
- DATABASE_URL: server-only PostgreSQL URL.
- MTA_GTFS_BASE_URL: reserved for future trip-update integration.
- NEXT_PUBLIC_APP_URL: public origin.
Never commit credentials. Add .env.local locally, and set deployment secrets through GitHub/Vercel.

## Checks
```sh
npm run lint
npm run typecheck
npm test
npm run build
python -m pytest etl/tests
```
CI runs these checks and migration upgrade/downgrade against PostgreSQL 16. Real local database execution is pending DATABASE_URL. No tests or CI results are claimed until executed.

## Branding and accessibility
Title lettering uses original typography with custom train-letter badges. Supporting graffiti text uses locally bundled Permanent Marker under its Apache license. The user’s eight-frame animated train.webp is preserved unchanged as the subway background. Reduced-motion users see its first frame. Keyboard users can select stations from the explorer; chart data has a table view. Graffiti is limited to the opening screen, keeping analytics legible. See `docs/image-assets.md` for the generation prompt and asset provenance.

## Important limitations
Historical analytics need database ingestion. Live arrival estimates and station-referenced train markers are implemented. GPS positions and historical ridership without database ingestion are unavailable. Monthly terminal reliability is implemented without PostgreSQL. Station arrival predictions can support a conditional positive verdict. Disruption verdicts use explicit GTFS effects or official MTA Mercury priorities; unknown severity remains unclassified. Public map artwork licensing is avoided by using original geometry based on free official data feeds. Production terms should still be reviewed before launch.

Development dependency audit: five high-severity findings in the ESLint glob chain have no automatic fix available at verification time. Production audit is clean.


## First historical ridership import

Add the database provider’s PostgreSQL connection string as DATABASE_URL in .env.local. With the Python dependencies installed, run `python -m etl.jobs.bootstrap --days 30` from the project folder. This applies the project’s migrations and imports the latest 30 source days from MTA’s official hourly ridership dataset. The bootstrap command reads .env.local without printing the connection string; existing shell configuration takes precedence.

## Live train map

`/api/live/trains` combines eight public MTA GTFS-Realtime feeds. Upstream fetches revalidate every 20 seconds; the browser refreshes every 30 seconds and immediately on returning to the tab. Train markers require a vehicle report and are anchored to the reported station, never invented GPS coordinates. Unstarted trip updates may contribute arrival forecasts but cannot become map markers. Cancelled trips and skipped predictions are excluded. Movement reports older than 90 seconds display “Awaiting update” instead of a countdown. Missing feeds are labeled as partial coverage; stale feeds are rejected and failed refreshes clear train markers. Live reports are independent of the typical scheduled day/night view.

The implementation was built independently from [MTA developer resources](https://www.mta.info/developers) and [MTA subway GTFS-Realtime documentation](https://www.mta.info/document/134521). The user-provided StandClear project was consulted for behavior and alert presentation, without importing its code, styling, or assets. Exact MTA symbols require a license under the MTA developer policy; official icon assets have not been added.


### Live verdict evidence
MTA Mercury extension 1001 is decoded according to the service-status schema linked by MTA Developers. Its official category, selector priority, and affected station list supplement generic GTFS effects. Active delay/cancellation/reduced/suspended priorities support disruption verdicts; expected delays and unknown categories alone do not. At stations, fresh predictions within five minutes can support Catch That Train! only with complete feed coverage, no paused/delayed train, and no active direct or related advisory. This is an arrival suggestion, not historical reliability or a walking-time comparison.

## Station explorer and shared routes

The station explorer groups platforms by official MTA complex IDs, keeping identically named but unrelated stations separate. Accessibility filters mean at least one mapped platform meets the selected category; station notes and equipment outages still determine the specific journey. Route links preserve line, service view, and optional station. Unknown or unavailable shared routes are ignored rather than creating nonexistent service. Alerts bypass the stale response cache; failed or expired reports never produce a favorable verdict.

Service-alert snapshots use a ten-minute expiry, following [GTFS Realtime best practices](https://gtfs.org/documentation/realtime/realtime-best-practices/). Train movement reports retain their separate freshness checks.

## Reliability without PostgreSQL

Monthly terminal on-time performance comes directly from MTA NY Open Data dataset f6rf-2a3t, cached hourly. Weekday and weekend records remain separate. Combined records use total on-time trips divided by total scheduled trips, not an average of percentages. Reported values are validated against counts. Express variants use base-line records; Z shows published joint J/Z records only. Terminal performance is not a station-level wait metric or a prediction for today.



## Roosevelt Island Tram
The map includes an approximate original terminal-to-terminal tram overlay, independent of the selected subway route, displayed in Day service only by design. This display choice does not mean the tram has no overnight service. Terminals and the route open a link to RIOC's current tram page with live station cameras and service information. No public machine-readable cabin-position or ETA feed was found; no animated vehicle or countdown is invented. Source: https://www.rioc.ny.gov/community/transportation/tram.

The tram popup now polls `/api/live/tram` every 30 seconds for scheduled departures from Roosevelt Island Transit. The upstream `isRealtime=false` records are displayed only as timetable estimates, never live tracking. Both directions show Eastern Time; responses marked stale or older than five minutes are rejected. Missing times remain unavailable.

Transit verdicts evaluate active subway disruption reports and fresh train arrivals. They do not calculate walking routes or compare journey times; no walking-router configuration is required.
