import asyncio
from typing import List, Dict, Any, Optional, AsyncGenerator
import openai
from openai import AsyncAzureOpenAI
import structlog
from app.core.config import settings

logger = structlog.get_logger(__name__)

class OpenAIService:
    def __init__(self):
        self.client = AsyncAzureOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
        )
        self.deployment_name = settings.AZURE_OPENAI_DEPLOYMENT_NAME
        
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        functions: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Generate AI response"""
        try:
            if system_prompt:
                messages = [{"role": "system", "content": system_prompt}] + messages
            
            kwargs = {
                "model": self.deployment_name,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            
            if functions:
                kwargs["functions"] = functions
                kwargs["function_call"] = "auto"
            
            response = await self.client.chat.completions.create(**kwargs)
            
            result = {
                "content": response.choices[0].message.content,
                "function_call": getattr(response.choices[0].message, 'function_call', None),
                "tokens_used": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                }
            }
            
            logger.info("openai_response_generated", tokens_used=result["tokens_used"]["total_tokens"])
            return result
            
        except Exception as e:
            logger.error("openai_generation_failed", error=str(e))
            raise
    
    async def generate_response_stream(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> AsyncGenerator[str, None]:
        """Generate streaming AI response"""
        try:
            if system_prompt:
                messages = [{"role": "system", "content": system_prompt}] + messages
            
            stream = await self.client.chat.completions.create(
                model=self.deployment_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error("openai_streaming_failed", error=str(e))
            raise

def get_openai_service() -> OpenAIService:
    return OpenAIService()
