SELECT station_id, EXTRACT(ISODOW FROM day)<6 AS weekday, AVG(ridership) AS daily_entries FROM station_daily_stats GROUP BY 1,2;
