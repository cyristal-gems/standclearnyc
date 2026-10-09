"""Create the project schema and import official ridership using local configuration."""
import argparse
import os
from pathlib import Path
from alembic import command
from alembic.config import Config
from etl.jobs.ingest import run

ROOT=Path(__file__).resolve().parents[2]
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--days',type=int,default=30)
    args=parser.parse_args()
    if not 1<=args.days<=366:
        parser.error('--days must be 1 through 366')
    if not os.environ.get('DATABASE_URL'):
        file=ROOT/'.env.local'
        if file.exists():
            for line in file.read_text().splitlines():
                key,sep,value=line.partition('=')
                if sep and key.strip()=='DATABASE_URL':
                    os.environ['DATABASE_URL']=value.strip().strip('\"').strip("'")
                    break
    if not os.environ.get('DATABASE_URL'):
        parser.exit(1,'Add DATABASE_URL to .env.local before importing ridership.\n')
    config=Config(str(ROOT/'alembic.ini'))
    config.set_main_option('script_location',str(ROOT/'etl/migrations'))
    try:
        command.upgrade(config,'head')
        run(args.days)
    except Exception:
        parser.exit(1,'Ridership setup could not complete. Check database access and source availability; credentials are not displayed.\n')
    print(f'Database migrations applied and latest {args.days} source days imported successfully.')

if __name__=='__main__':
    main()
