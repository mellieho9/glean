import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.user import router as user_router
from routes.schema import router as schema_router
from routes.agent import router as agent_router

app = FastAPI(
    title="Glean API", description="APIs for the Glean project", version="1.0.0"
)

origins = ["http://localhost:5173", "http://localhost:3000"]
if os.environ.get("FRONTEND_URL"):
    origins.append(os.environ["FRONTEND_URL"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(schema_router)
app.include_router(agent_router)
