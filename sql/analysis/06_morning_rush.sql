SELECT station_id,SUM(average_entries) AS morning_entries FROM station_hourly_profiles WHERE weekday AND hour>=7 AND hour<10 GROUP BY 1 ORDER BY 2 DESC;
