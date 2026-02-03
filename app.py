from fastapi import FastAPI
from routes.user import router as user_router

# from routes.adaptor import router as adaptor_router
from routes.schema import router as schema_router

app = FastAPI(
    title="Glean API", description="APIs for the Glean project", version="1.0.0"
)

app.include_router(user_router)
# app.include_router(adaptor_router)
app.include_router(schema_router)
