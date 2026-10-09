from alembic import op
import sqlalchemy as sa
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None
def upgrade():
    op.create_table("stations", sa.Column("station_id", sa.Text, primary_key=True), sa.Column("station_name", sa.Text, nullable=False), sa.Column("borough", sa.Text, nullable=False), sa.Column("latitude", sa.Float, nullable=False), sa.Column("longitude", sa.Float, nullable=False), sa.CheckConstraint("latitude BETWEEN -90 AND 90"), sa.CheckConstraint("longitude BETWEEN -180 AND 180"))
    op.create_table("source_metadata", sa.Column("source_name", sa.Text, primary_key=True), sa.Column("source_identifier", sa.Text, nullable=False), sa.Column("last_checked_at", sa.DateTime(timezone=True)), sa.Column("source_last_updated_at", sa.DateTime(timezone=True)), sa.Column("last_successful_ingestion_at", sa.DateTime(timezone=True)), sa.Column("row_count", sa.BigInteger, nullable=False, server_default="0"), sa.Column("status", sa.Text, nullable=False, server_default="pending"), sa.CheckConstraint("row_count >= 0"))
def downgrade():
    op.drop_table("source_metadata")
    op.drop_table("stations")
