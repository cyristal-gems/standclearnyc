"""Preserve signed transfer values published by the official MTA source."""
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

def upgrade():
    # PostgreSQL's default name for the unnamed check created in revision 0002.
    op.drop_constraint("ridership_hourly_check", "ridership_hourly", type_="check")
    op.create_check_constraint("ridership_hourly_ridership_nonnegative", "ridership_hourly", "ridership >= 0")

def downgrade():
    # Fails rather than deleting signed source records if they have been imported.
    op.drop_constraint("ridership_hourly_ridership_nonnegative", "ridership_hourly", type_="check")
    op.create_check_constraint("ridership_hourly_check", "ridership_hourly", "ridership >= 0 AND transfers >= 0")
