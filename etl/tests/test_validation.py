import pytest
from pydantic import ValidationError
from etl.validation import Station

def test_rejects_invalid_coordinates():
    with pytest.raises(ValidationError):
        Station(station_id="test", station_name="Test", borough="Test", latitude=91, longitude=0)
