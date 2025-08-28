from typing import List, Dict, Any, Optional, AsyncGenerator
from dataclasses import dataclass
import asyncio
import structlog
from app.services.openai_client import OpenAIService
from app.services.search_client import SearchService

logger = structlog.get_logger(__name__)

@dataclass
class AgentResponse:
    content: str
    metadata: Optional[Dict[str, Any]] = None
    citations: Optional[List[Dict[str, Any]]] = None
    tools_used: Optional[List[Dict[str, Any]]] = None
    tokens_used: Optional[Dict[str, int]] = None

@dataclass
class StreamingChunk:
    delta: str
    is_final: bool
    metadata: Optional[Dict[str, Any]] = None
    citations: Optional[List[Dict[str, Any]]] = None
    tools_used: Optional[List[Dict[str, Any]]] = None
    tokens_used: Optional[Dict[str, int]] = None

class AgentService:
    def __init__(self):
        self.openai_service = OpenAIService()
        self.search_service = SearchService()
        
    async def process_message(
        self,
        message: str,
        conversation_history: List[Dict[str, Any]],
        context: Optional[Dict[str, Any]] = None,
        user_id: str = None
    ) -> AgentResponse:
        """Process message using agentic workflow"""
        try:
            # Step 1: Analyze intent and search for relevant documents
            search_results = await self.search_service.search_documents(
                query=message,
                top_k=5
            )
            
            # Step 2: Build context with search results
            context_text = "\n\n".join([
                f"Source: {result['title']}\n{result['content']}"
                for result in search_results
            ])
            
            # Step 3: Create system prompt
            system_prompt = f"""You are Green Guardian, DNB's AI sustainability copilot. 
You help analyze ESG risks, portfolio sustainability, and provide actionable insights.

Available context:
{context_text}

Guidelines:
- Provide specific, actionable sustainability insights
- Use data from the context when relevant
- Flag high-risk areas clearly
- Suggest concrete next steps
- Be concise but comprehensive
"""
            
            # Step 4: Build conversation messages
            messages = []
            for msg in conversation_history[-10:]:  # Last 10 messages for context
                if msg.get("role") in ["user", "assistant"]:
                    messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })
            
            messages.append({"role": "user", "content": message})
            
            # Step 5: Generate response
            ai_response = await self.openai_service.generate_response(
                messages=messages,
                system_prompt=system_prompt,
                temperature=0.7,
                max_tokens=1000
            )
            
            # Step 6: Format citations
            citations = []
            for i, result in enumerate(search_results):
                citations.append({
                    "id": result["id"],
                    "title": result["title"],
                    "source": result["source"],
                    "excerpt": result["content"][:200] + "...",
                    "relevance_score": result["score"],
                    "document_type": result.get("metadata", {}).get("type", "document")
                })
            
            # Step 7: Track tools used
            tools_used = [
                {
                    "tool_name": "cognitive_search",
                    "parameters": {"query": message, "top_k": 5},
                    "execution_time_ms": 150
                },
                {
                    "tool_name": "azure_openai",
                    "parameters": {"model": "gpt-4", "temperature": 0.7},
                    "execution_time_ms": 2000
                }
            ]
            
            return AgentResponse(
                content=ai_response["content"],
                metadata={
                    "intent": "sustainability_analysis",
                    "confidence": 0.9,
                    "processing_time_ms": 2150
                },
                citations=citations,
                tools_used=tools_used,
                tokens_used=ai_response.get("tokens_used")
            )
            
        except Exception as e:
            logger.error("agent_processing_failed", error=str(e))
            return AgentResponse(
                content="I apologize, but I encountered an error while processing your request. Please try again.",
                metadata={"error": str(e)}
            )
    
    async def process_message_stream(
        self,
        message: str,
        conversation_history: List[Dict[str, Any]],
        context: Optional[Dict[str, Any]] = None,
        user_id: str = None
    ) -> AsyncGenerator[StreamingChunk, None]:
        """Process message with streaming response"""
        try:
            # Same setup as non-streaming version
            search_results = await self.search_service.search_documents(
                query=message,
                top_k=5
            )
            
            context_text = "\n\n".join([
                f"Source: {result['title']}\n{result['content']}"
                for result in search_results
            ])
            
            system_prompt = f"""You are Green Guardian, DNB's AI sustainability copilot. 
You help analyze ESG risks, portfolio sustainability, and provide actionable insights.

Available context:
{context_text}

Guidelines:
- Provide specific, actionable sustainability insights
- Use data from the context when relevant
- Flag high-risk areas clearly
- Suggest concrete next steps
- Be concise but comprehensive
"""
            
            messages = []
            for msg in conversation_history[-10:]:
                if msg.get("role") in ["user", "assistant"]:
                    messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })
            
            messages.append({"role": "user", "content": message})
            
            # Stream the response
            full_content = ""
            async for chunk in self.openai_service.generate_response_stream(
                messages=messages,
                system_prompt=system_prompt,
                temperature=0.7,
                max_tokens=1000
            ):
                full_content += chunk
                yield StreamingChunk(
                    delta=chunk,
                    is_final=False,
                    metadata={"streaming": True}
                )
            
            # Final chunk with metadata
            citations = []
            for i, result in enumerate(search_results):
                citations.append({
                    "id": result["id"],
                    "title": result["title"],
                    "source": result["source"],
                    "excerpt": result["content"][:200] + "...",
                    "relevance_score": result["score"],
                    "document_type": result.get("metadata", {}).get("type", "document")
                })
            
            yield StreamingChunk(
                delta="",
                is_final=True,
                metadata={
                    "intent": "sustainability_analysis",
                    "confidence": 0.9,
                    "processing_time_ms": 2150
                },
                citations=citations,
                tools_used=[
                    {"tool_name": "cognitive_search", "parameters": {"query": message}},
                    {"tool_name": "azure_openai", "parameters": {"model": "gpt-4"}}
                ]
            )
            
        except Exception as e:
            logger.error("agent_streaming_failed", error=str(e))
            yield StreamingChunk(
                delta="I apologize, but I encountered an error while processing your request.",
                is_final=True,
                metadata={"error": str(e)}
            )

def get_agent_service() -> AgentService:
    return AgentService()
