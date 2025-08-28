import logging
import sys
from typing import Any, Dict
import structlog
from structlog.stdlib import LoggerFactory
import json
from datetime import datetime

from app.core.config import settings

def configure_logging():
    """Configure structured logging for the application"""
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer() if settings.LOG_FORMAT == "json" else structlog.dev.ConsoleRenderer(),
        ],
        context_class=dict,
        logger_factory=LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configure Python logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.LOG_LEVEL.upper()),
    )
    
    # Set specific loggers
    logging.getLogger("uvicorn.access").disabled = True
    logging.getLogger("azure").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)

class CorrelationIDProcessor:
    """Add correlation ID to log records"""
    
    def __init__(self, correlation_id_key: str = "correlation_id"):
        self.correlation_id_key = correlation_id_key
    
    def __call__(self, logger, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        # This would be populated from request context in a real app
        event_dict[self.correlation_id_key] = "default"
        return event_dict

class ApplicationInsightsHandler(logging.Handler):
    """Custom handler to send logs to Azure Application Insights"""
    
    def __init__(self):
        super().__init__()
        self.connection_string = settings.APPINSIGHTS_CONNECTION_STRING
        
    def emit(self, record: logging.LogRecord):
        """Emit log record to Application Insights"""
        try:
            # In a real implementation, this would send to Application Insights
            # For now, we'll just format and output
            log_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
                "module": record.module,
                "function": record.funcName,
                "line": record.lineno,
            }
            
            if hasattr(record, "correlation_id"):
                log_entry["correlation_id"] = record.correlation_id
                
            if record.exc_info:
                log_entry["exception"] = self.format(record)
                
            # This would send to Application Insights in production
            print(json.dumps(log_entry), file=sys.stderr)
            
        except Exception:
            self.handleError(record)

def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a configured logger instance"""
    return structlog.get_logger(name)
