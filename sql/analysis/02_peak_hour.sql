WITH ranked AS (SELECT *,ROW_NUMBER() OVER(PARTITION BY station_id,weekday ORDER BY average_entries DESC,hour) AS rank FROM station_hourly_profiles) SELECT * FROM ranked WHERE rank=1;
