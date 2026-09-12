from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes.risk import router as risk_router
from backend.app.core.config import settings


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered fraud risk analysis API.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(risk_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "healthy",
        "service": settings.app_name,
    }