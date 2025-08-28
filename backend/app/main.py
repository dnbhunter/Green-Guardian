from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
import time
import structlog

from app.core.config import settings
from app.core.logging import configure_logging
from app.core.security import get_current_user
from app.routers import auth, chat, ingest, search, admin
from app.core.exceptions import CustomHTTPException

# Configure structured logging
configure_logging()
logger = structlog.get_logger()

def create_application() -> FastAPI:
    """Create and configure FastAPI application"""
    
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.VERSION,
        description="DNB's AI Sustainability Copilot API",
        docs_url=None,  # We'll customize this
        redoc_url=None,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
    )
    
    # Middleware
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    
    # Custom middleware for request timing and logging
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start_time = time.time()
        
        # Log incoming request
        logger.info(
            "request_started",
            method=request.method,
            path=request.url.path,
            query_params=str(request.query_params),
            client_ip=request.client.host if request.client else None,
        )
        
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Log response
        logger.info(
            "request_completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            process_time=process_time,
        )
        
        response.headers["X-Process-Time"] = str(process_time)
        return response
    
    # Exception handlers
    @app.exception_handler(CustomHTTPException)
    async def custom_http_exception_handler(request: Request, exc: CustomHTTPException):
        logger.error(
            "custom_http_exception",
            status_code=exc.status_code,
            detail=exc.detail,
            path=request.url.path,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "type": exc.error_type}
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(
            "unhandled_exception",
            error=str(exc),
            error_type=type(exc).__name__,
            path=request.url.path,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error", "type": "server_error"}
        )
    
    # Routes
    app.include_router(
        auth.router,
        prefix=f"{settings.API_V1_STR}/auth",
        tags=["Authentication"]
    )
    
    app.include_router(
        chat.router,
        prefix=f"{settings.API_V1_STR}/chat",
        tags=["Chat"],
        dependencies=[],  # Auth will be handled per endpoint
    )
    
    app.include_router(
        ingest.router,
        prefix=f"{settings.API_V1_STR}/ingest",
        tags=["Data Ingestion"],
        dependencies=[],
    )
    
    app.include_router(
        search.router,
        prefix=f"{settings.API_V1_STR}/search",
        tags=["Search"],
        dependencies=[],
    )
    
    app.include_router(
        admin.router,
        prefix=f"{settings.API_V1_STR}/admin",
        tags=["Administration"],
        dependencies=[],
    )
    
    # Health check
    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "version": settings.VERSION}
    
    # Custom docs
    @app.get("/docs", include_in_schema=False)
    async def custom_swagger_ui_html():
        return get_swagger_ui_html(
            openapi_url=app.openapi_url,
            title=f"{app.title} - Swagger UI",
            swagger_js_url="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js",
            swagger_css_url="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css",
        )
    
    # Custom OpenAPI schema
    def custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema
        
        openapi_schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
        )
        
        # Add security schemes
        openapi_schema["components"]["securitySchemes"] = {
            "bearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
            },
            "azureAD": {
                "type": "oauth2",
                "flows": {
                    "authorizationCode": {
                        "authorizationUrl": f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}/oauth2/v2.0/authorize",
                        "tokenUrl": f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}/oauth2/v2.0/token",
                        "scopes": {
                            "openid": "OpenID Connect",
                            "profile": "User profile",
                            "email": "Email address",
                        },
                    }
                },
            },
        }
        
        app.openapi_schema = openapi_schema
        return app.openapi_schema
    
    app.openapi = custom_openapi
    
    # Startup event
    @app.on_event("startup")
    async def startup_event():
        logger.info("application_startup", version=settings.VERSION)
    
    # Shutdown event
    @app.on_event("shutdown")
    async def shutdown_event():
        logger.info("application_shutdown")
    
    return app

app = create_application()
