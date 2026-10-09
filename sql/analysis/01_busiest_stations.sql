SELECT s.station_name,SUM(d.ridership) AS entries FROM station_daily_stats d JOIN stations s USING(station_id) GROUP BY s.station_id ORDER BY entries DESC;
