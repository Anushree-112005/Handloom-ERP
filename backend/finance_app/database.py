from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./cubebook.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    __allow_unmapped__ = True


import time
import logging

LAST_SYNC_TIME = 0.0
SYNC_INTERVAL = 10.0  # sync at most once every 10 seconds

def get_db():
    global LAST_SYNC_TIME
    current_time = time.time()
    if current_time - LAST_SYNC_TIME > SYNC_INTERVAL:
        LAST_SYNC_TIME = current_time
        try:
            from finance_app.scripts.sync_realtime_data import sync_data
            sync_data()
        except Exception as e:
            logging.getLogger("finance_app").warning(f"Cubebook auto-sync skipped: {e}")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

