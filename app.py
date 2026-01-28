from fastapi import FastAPI
from routes.database import router as database_router

app = FastAPI(
    title="Glean API",
    description="APIs for the Glean project",
    version="1.0.0"
)

# Include database routes
app.include_router(database_router)
