from typing import Optional, List, Any, Dict
from pydantic import AnyHttpUrl, BaseSettings, validator
import os
from functools import lru_cache

class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "Green Guardian API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"
    
    # Azure AD settings
    AZURE_CLIENT_ID: str
    AZURE_TENANT_ID: str
    AZURE_CLIENT_SECRET: Optional[str] = None
    
    # Azure OpenAI
    AZURE_OPENAI_ENDPOINT: str
    AZURE_OPENAI_API_KEY: str
    AZURE_OPENAI_API_VERSION: str = "2023-12-01-preview"
    AZURE_OPENAI_DEPLOYMENT_NAME: str = "gpt-4"
    AZURE_OPENAI_EMBEDDING_DEPLOYMENT: str = "text-embedding-ada-002"
    
    # Azure Cognitive Search
    AZURE_SEARCH_ENDPOINT: str
    AZURE_SEARCH_API_KEY: str
    AZURE_SEARCH_INDEX_NAME: str = "green-guardian-index"
    
    # Azure Storage
    AZURE_STORAGE_CONNECTION_STRING: str
    AZURE_STORAGE_CONTAINER_NAME: str = "documents"
    
    # Azure Key Vault
    AZURE_KEY_VAULT_URL: Optional[str] = None
    
    # Azure Application Insights
    APPINSIGHTS_CONNECTION_STRING: str
    APPINSIGHTS_INSTRUMENTATION_KEY: Optional[str] = None
    
    # Database
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/green_guardian"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 3600  # 1 hour
    
    # Azure Service Bus (for background tasks)
    AZURE_SERVICE_BUS_CONNECTION_STRING: Optional[str] = None
    AZURE_SERVICE_BUS_QUEUE_NAME: str = "green-guardian-tasks"
    
    # Azure API Management
    APIM_GATEWAY_URL: Optional[str] = None
    APIM_SUBSCRIPTION_KEY: Optional[str] = None
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Content filtering
    CONTENT_FILTER_ENABLED: bool = True
    PII_DETECTION_ENABLED: bool = True
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Model settings
    MAX_TOKENS_PER_REQUEST: int = 4096
    TEMPERATURE: float = 0.7
    TOP_P: float = 0.9
    FREQUENCY_PENALTY: float = 0.0
    PRESENCE_PENALTY: float = 0.0
    
    # Search settings
    SEARCH_TOP_K: int = 10
    SEARCH_SCORE_THRESHOLD: float = 0.7
    
    # File upload settings
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    ALLOWED_FILE_EXTENSIONS: List[str] = [".pdf", ".txt", ".csv", ".json", ".xlsx"]
    
    # Background task settings
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    # Monitoring and telemetry
    PROMETHEUS_METRICS_ENABLED: bool = True
    STRUCTURED_LOGGING_ENABLED: bool = True
    
    # Feature flags
    STREAMING_ENABLED: bool = True
    VECTOR_SEARCH_ENABLED: bool = True
    FUNCTION_CALLING_ENABLED: bool = True
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        
    def get_database_url(self) -> str:
        """Get database URL with proper encoding"""
        return self.DATABASE_URL
    
    def get_openai_config(self) -> Dict[str, Any]:
        """Get OpenAI configuration"""
        return {
            "api_type": "azure",
            "api_base": self.AZURE_OPENAI_ENDPOINT,
            "api_version": self.AZURE_OPENAI_API_VERSION,
            "api_key": self.AZURE_OPENAI_API_KEY,
            "deployment_id": self.AZURE_OPENAI_DEPLOYMENT_NAME,
            "model": self.AZURE_OPENAI_DEPLOYMENT_NAME,
        }
    
    def get_search_config(self) -> Dict[str, Any]:
        """Get Azure Cognitive Search configuration"""
        return {
            "endpoint": self.AZURE_SEARCH_ENDPOINT,
            "api_key": self.AZURE_SEARCH_API_KEY,
            "index_name": self.AZURE_SEARCH_INDEX_NAME,
        }

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

settings = get_settings()
