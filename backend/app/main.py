import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.bill_verification import log_bill_verification
from app.congress_client import CongressClient
from app.config import settings
from app.analytics_store import init_analytics_db
from app.routes import analytics, health, involve, members, metrics

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.congress_client = CongressClient()
    try:
        init_analytics_db()
    except Exception:
        logger.exception("Analytics database init failed (non-fatal)")
    try:
        await log_bill_verification(app.state.congress_client)
    except Exception:
        logger.exception("Tracked bill verification failed at startup")
        raise
    yield
    await app.state.congress_client.close()


app = FastAPI(
    title="Operation Child Shield API",
    description="Transparency API for child protection voting records from Congress.gov",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(members.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(involve.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")