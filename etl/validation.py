from pydantic import BaseModel, Field
class Station(BaseModel):
    station_id: str = Field(min_length=1)
    station_name: str = Field(min_length=1)
    borough: str = Field(min_length=1)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
