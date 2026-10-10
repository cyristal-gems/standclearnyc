# Stand Clear of the Closing Doors, Please!

Stand Clear of the Closing Doors, Please! brings New York City transit information together in an interactive, NYC-inspired experience. Built with official MTA data, it helps riders explore subway routes, stations, and typical day and night service. Live arrivals and service alerts offer a clearer view of current subway conditions. Station details and accessibility information help visitors understand their options across the system. Historical line reliability adds context beyond the next train, while ridership analytics become available once the database is connected and records are imported. The Roosevelt Island Tram and source-linked subway facts extend the experience beyond everyday service updates.

## 🌟 Key Features

- **Interactive subway map:** Explore day/night service, highlight routes, and find stations.
- **Live transit information:** Check train arrivals, service alerts, and elevator outages.
- **Station insights:** See scheduled next stops and live arrivals, with station accessibility shown on the map.
- **Historical analytics:** View MTA monthly line reliability now; ridership trends and station rankings become available after database ingestion.
- **Line facts:** Discover subway history and route-specific facts linked to MTA sources.

## 🧰 Tech Stack

- **Next.js:** Provides the application framework, page rendering, and server-side API routes. The App Router connects the interface to live alerts and stored analytics.
- **React:** Builds reusable interactive components for the map controls, station popups, dashboards, and navigation.
- **TypeScript:** Adds static types to application code and data contracts, helping catch inconsistent inputs and integration errors during development.
- **Tailwind CSS and custom CSS:** Handle styling and responsive presentation, including the dark interface, map overlays, and loading screen.
- **MapLibre GL JS:** Renders the interactive geographic subway map with route highlighting, station markers, transfer links, and popups.
- **OpenStreetMap:** Supplies the readable geographic basemap beneath subway and tram routes. Source attribution remains visible on the map.
- **Node.js 22:** Runs the web application and its server-side data endpoints. The pg client connects those endpoints to PostgreSQL.
- **PostgreSQL / Neon:** Stores station metadata, historical hourly ridership, and ingestion freshness records. SQL views and indexed queries support dashboard summaries.
- **Python:** Runs the data ingestion and map snapshot jobs, preparing official source data for the application.
- **HTTPX:** Retrieves official transit and ridership datasets for the Python ingestion pipeline.
- **Pydantic:** Validates incoming records before they enter the data pipeline.
- **SQLAlchemy and psycopg:** Provide Python database access for transactional ingestion and PostgreSQL operations.
- **Alembic:** Tracks database schema changes through versioned migrations.
- **GTFS and GTFS-Realtime bindings:** Use official scheduled transit feeds for routes and stops, and decode live train reports, arrival estimates, and service advisory messages.
- **GitHub Actions:** Defines automated checks and scheduled data update workflows, which run after the repository and required secrets are configured.
- **Vitest, pytest, and ESLint:** Check TypeScript behavior, Python data processing, and JavaScript/TypeScript code quality.

## 🚆 Visit The Site Here

[Stand Clear of the Closing Doors, Please!](https://standclearnyc.vercel.app)

## 💁🏽‍♀️ Contact

- **LinkedIn:** [linkedin.com/in/cyristalj](https://www.linkedin.com/in/cyristalj)
- **GitHub:** [github.com/cyristal-gems](https://github.com/cyristal-gems)
- **Email:** [cyrisjoseph@outlook.com](mailto:cyrisjoseph@outlook.com)

## License and Third-Party Notices

Copyright © 2026 Cyristal Joseph. All rights reserved. The original application code and title artwork are not licensed under MIT or any other open-source license.

MTA data and intellectual property, fonts, artwork, and software dependencies remain subject to their respective terms and licenses, including MIT where applicable to third-party dependencies. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution and details.
