SELECT s.borough,SUM(d.ridership) AS entries FROM station_daily_stats d JOIN stations s USING(station_id) GROUP BY 1 ORDER BY 2 DESC;
