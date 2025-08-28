from fastapi import HTTPException, status
from typing import Any, Dict, Optional

class CustomHTTPException(HTTPException):
    """Custom HTTP exception with additional metadata"""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_type: str = "generic_error",
        metadata: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_type = error_type
        self.metadata = metadata or {}

class AuthenticationError(CustomHTTPException):
    """Authentication related errors"""
    
    def __init__(self, detail: str = "Authentication failed", metadata: Dict[str, Any] = None):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_type="authentication_error",
            metadata=metadata
        )

class AuthorizationError(CustomHTTPException):
    """Authorization related errors"""
    
    def __init__(self, detail: str = "Insufficient permissions", metadata: Dict[str, Any] = None):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_type="authorization_error",
            metadata=metadata
        )

class ValidationError(CustomHTTPException):
    """Input validation errors"""
    
    def __init__(self, detail: str = "Validation failed", metadata: Dict[str, Any] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_type="validation_error",
            metadata=metadata
        )

class NotFoundError(CustomHTTPException):
    """Resource not found errors"""
    
    def __init__(self, detail: str = "Resource not found", metadata: Dict[str, Any] = None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_type="not_found_error",
            metadata=metadata
        )

class ConflictError(CustomHTTPException):
    """Resource conflict errors"""
    
    def __init__(self, detail: str = "Resource conflict", metadata: Dict[str, Any] = None):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            error_type="conflict_error",
            metadata=metadata
        )

class RateLimitError(CustomHTTPException):
    """Rate limiting errors"""
    
    def __init__(self, detail: str = "Rate limit exceeded", metadata: Dict[str, Any] = None):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            error_type="rate_limit_error",
            metadata=metadata
        )

class ExternalServiceError(CustomHTTPException):
    """External service errors"""
    
    def __init__(self, detail: str = "External service error", metadata: Dict[str, Any] = None):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail,
            error_type="external_service_error",
            metadata=metadata
        )

class ContentFilterError(CustomHTTPException):
    """Content filtering errors"""
    
    def __init__(self, detail: str = "Content filtered", metadata: Dict[str, Any] = None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_type="content_filter_error",
            metadata=metadata
        )

class ModelError(CustomHTTPException):
    """AI model related errors"""
    
    def __init__(self, detail: str = "Model error", metadata: Dict[str, Any] = None):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            error_type="model_error",
            metadata=metadata
        )
