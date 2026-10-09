"""Representative weekday service, excluding start/end-of-service transition trips."""
def representative_mode(departures):
    if not departures:
        return None
    seconds=[]
    for departure in departures:
        h,m,s=map(int,departure.split(':'))
        seconds.append(h*3600+m*60+s)
    hour=((seconds[0]+seconds[-1])/7200)%24
    if 1 <= hour < 4:
        return 'night'
    if 7 <= hour < 19:
        return 'day'
    return None


def weekday_services(calendar, exceptions, today):
    """Choose the next active weekday, honoring GTFS validity and exceptions."""
    import datetime
    for offset in range(14):
        day = today + datetime.timedelta(days=offset)
        if day.weekday() >= 5:
            continue
        stamp = day.strftime('%Y%m%d')
        key = ('monday', 'tuesday', 'wednesday', 'thursday', 'friday')[day.weekday()]
        services = {row['service_id'] for row in calendar if row['start_date'] <= stamp <= row['end_date'] and row[key] == '1'}
        for row in exceptions:
            if row['date'] == stamp:
                if row['exception_type'] == '1':
                    services.add(row['service_id'])
                elif row['exception_type'] == '2':
                    services.discard(row['service_id'])
        if services:
            return day.isoformat(), services
    raise ValueError('No current weekday service in official schedule')
