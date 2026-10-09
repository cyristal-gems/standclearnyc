# Vercel deployment

Import the repository into Vercel and select standclearnyc (the folder containing package.json) as the Root Directory. Use the Next.js framework preset; vercel.json specifies installation and build commands. The public map snapshot is included with the application and traced into the station verdict function.

Set DATABASE_URL privately in Vercel when the database is ready. The map, train reports, alerts, and elevator reports work without a database; historical analytics require migrations and ingestion. Set NEXT_PUBLIC_APP_URL to the actual published HTTPS URL once assigned. Never commit .env.local.

Live requests use a 30-second function limit with upstream timeouts and explicit unavailable states. Visitors refresh trains and alerts every 30 seconds, and equipment every minute. These requests do not require a scheduled Vercel job.

The Python historical ingestion and map refresh jobs run through the existing GitHub Actions workflows, not inside the website request. Configure their database secret separately after connecting PostgreSQL. Verify /api/health, station arrivals, service alerts, and an equipment report on the deployment preview before publishing.

Configuration follows [Vercel function duration documentation](https://vercel.com/docs/functions/configuring-functions/duration) and [Next.js file tracing guidance](https://vercel.com/docs/functions/limitations).

The project pins Node.js 22 for local and Vercel parity. A successful local production build verifies the Next.js output; an actual Vercel preview still requires importing the repository into the user’s Vercel account. No deployment URL is asserted until a deployment succeeds.
