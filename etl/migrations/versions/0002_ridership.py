from alembic import op
import sqlalchemy as sa
revision="0002"
down_revision="0001"
branch_labels=None
depends_on=None
def upgrade():
    op.add_column("stations",sa.Column("routes",sa.Text,nullable=False,server_default=""))
    op.add_column("stations",sa.Column("gtfs_stop_ids",sa.Text,nullable=False,server_default=""))
    op.add_column("stations",sa.Column("accessibility",sa.Text))
    op.create_table("ridership_hourly",sa.Column("station_id",sa.Text,sa.ForeignKey("stations.station_id"),primary_key=True),sa.Column("timestamp",sa.DateTime(timezone=False),primary_key=True),sa.Column("payment_method",sa.Text,primary_key=True),sa.Column("fare_category",sa.Text,primary_key=True),sa.Column("ridership",sa.Numeric,nullable=False),sa.Column("transfers",sa.Numeric,nullable=False),sa.Column("source_updated_at",sa.DateTime(timezone=True),nullable=False),sa.CheckConstraint("ridership >= 0 AND transfers >= 0"))
    op.create_index("ix_ridership_timestamp","ridership_hourly",["timestamp"])
    op.execute("CREATE VIEW station_daily_stats AS SELECT station_id, timestamp::date AS day, SUM(ridership) AS ridership, SUM(transfers) AS transfers FROM ridership_hourly GROUP BY 1,2")
    op.execute("CREATE MATERIALIZED VIEW station_hourly_profiles AS SELECT station_id, EXTRACT(HOUR FROM timestamp)::int AS hour, EXTRACT(ISODOW FROM timestamp) < 6 AS weekday, SUM(ridership) / COUNT(DISTINCT timestamp::date) AS average_entries FROM ridership_hourly GROUP BY 1,2,3 WITH NO DATA")
    op.execute("CREATE UNIQUE INDEX ix_hourly_profiles ON station_hourly_profiles(station_id,hour,weekday)")
def downgrade():
    op.execute("DROP MATERIALIZED VIEW station_hourly_profiles")
    op.execute("DROP VIEW station_daily_stats")
    op.drop_table("ridership_hourly")
    for name in ("routes","gtfs_stop_ids","accessibility"):op.drop_column("stations",name)
