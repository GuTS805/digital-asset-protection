from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os
import logging

load_dotenv()
logging.basicConfig(level=logging.INFO)

from routers import assets, violations, monitoring
from routers.auth import router as auth_router, verify_token
from services.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="Digital Asset Protection API",
    description="Protect and monitor digital sports media against unauthorized use",
    version="1.0.0",
    lifespan=lifespan,
)

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])

_protected = [Depends(verify_token)]
app.include_router(assets.router, prefix="/api/assets", tags=["Assets"], dependencies=_protected)
app.include_router(violations.router, prefix="/api/violations", tags=["Violations"], dependencies=_protected)
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["Monitoring"], dependencies=_protected)


@app.get("/")
def root():
    return {
        "service": "Digital Asset Protection API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
