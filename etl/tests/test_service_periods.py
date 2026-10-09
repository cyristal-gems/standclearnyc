from etl.service_periods import representative_mode

def test_transition_trip_does_not_become_whole_night_route():
    assert representative_mode(['23:45:00','24:30:00']) is None
    assert representative_mode(['05:30:00','06:30:00']) is None

def test_gtfs_hours_after_midnight_and_core_day():
    assert representative_mode(['25:00:00','26:00:00']) == 'night'
    assert representative_mode(['12:00:00','13:00:00']) == 'day'
    assert representative_mode([]) is None


def test_active_weekday_honors_dates_and_exceptions():
    import datetime
    from etl.service_periods import weekday_services
    base = dict(start_date='20261001',end_date='20261031',monday='1',tuesday='1',wednesday='1',thursday='1',friday='1')
    rows = [dict(base,service_id='current'),dict(base,service_id='expired',end_date='20261004')]
    day, services = weekday_services(rows,[dict(service_id='current',date='20261005',exception_type='2'),dict(service_id='special',date='20261005',exception_type='1')],datetime.date(2026,10,5))
    assert day == '2026-10-05'
    assert services == {'special'}
