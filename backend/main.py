from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.upload import upload_router
from routes.query import query_router
# from routes.actions import actions_router

app = FastAPI(title="Echo – Contract Assistant")

# Register routers
app.include_router(upload_router)
app.include_router(query_router)
# app.include_router(actions_router)

# Allowed frontend URLs
origins = [
    "http://localhost:3000",      # Local dev
    # "https://www.echodoc.app",  # Production
]

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
