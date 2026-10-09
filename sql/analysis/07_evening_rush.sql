SELECT station_id,SUM(average_entries) AS evening_entries FROM station_hourly_profiles WHERE weekday AND hour>=16 AND hour<19 GROUP BY 1 ORDER BY 2 DESC;
