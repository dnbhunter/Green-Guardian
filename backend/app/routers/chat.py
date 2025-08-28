from datetime import datetime
from typing import List, Optional, AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import uuid
import structlog

from app.core.security import get_current_user
from app.core.exceptions import ValidationError, ModelError
from app.services.openai_client import OpenAIService
from app.services.search_client import SearchService
from app.services.agents import AgentService

logger = structlog.get_logger(__name__)

router = APIRouter()

class ChatMessage(BaseModel):
    id: str
    content: str
    role: str  # 'user', 'assistant', 'system'
    timestamp: datetime
    conversation_id: str
    metadata: Optional[dict] = None
    citations: Optional[List[dict]] = None
    tools_used: Optional[List[dict]] = None
    tokens_used: Optional[dict] = None

class Conversation(BaseModel):
    id: str
    title: str
    messages: List[ChatMessage]
    created_at: datetime
    updated_at: datetime
    user_id: str
    is_archived: bool = False
    tags: List[str] = []
    summary: Optional[str] = None

class SendMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    context: Optional[dict] = None

class CreateConversationRequest(BaseModel):
    title: str

class StreamResponse(BaseModel):
    delta: str
    conversation_id: str
    message_id: str
    is_final: bool
    metadata: Optional[dict] = None

# Mock data storage (replace with database in production)
conversations_db = {}
messages_db = {}

@router.get("/conversations", response_model=List[Conversation])
async def get_conversations(current_user: dict = Depends(get_current_user)):
    """Get all conversations for the current user"""
    try:
        user_id = current_user.get("id")
        user_conversations = [
            conv for conv in conversations_db.values() 
            if conv.get("user_id") == user_id and not conv.get("is_archived", False)
        ]
        
        # Convert to Conversation objects
        result = []
        for conv_data in user_conversations:
            conv_messages = [
                msg for msg in messages_db.values() 
                if msg.get("conversation_id") == conv_data["id"]
            ]
            conv_messages.sort(key=lambda x: x["timestamp"])
            
            result.append(Conversation(
                id=conv_data["id"],
                title=conv_data["title"],
                messages=[ChatMessage(**msg) for msg in conv_messages],
                created_at=conv_data["created_at"],
                updated_at=conv_data["updated_at"],
                user_id=conv_data["user_id"],
                is_archived=conv_data.get("is_archived", False),
                tags=conv_data.get("tags", []),
                summary=conv_data.get("summary")
            ))
        
        logger.info("conversations_retrieved", user_id=user_id, count=len(result))
        return result
        
    except Exception as e:
        logger.error("get_conversations_failed", user_id=current_user.get("id"), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversations"
        )

@router.get("/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific conversation"""
    try:
        conversation = conversations_db.get(conversation_id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        if conversation["user_id"] != current_user.get("id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get messages
        conv_messages = [
            msg for msg in messages_db.values() 
            if msg.get("conversation_id") == conversation_id
        ]
        conv_messages.sort(key=lambda x: x["timestamp"])
        
        return Conversation(
            id=conversation["id"],
            title=conversation["title"],
            messages=[ChatMessage(**msg) for msg in conv_messages],
            created_at=conversation["created_at"],
            updated_at=conversation["updated_at"],
            user_id=conversation["user_id"],
            is_archived=conversation.get("is_archived", False),
            tags=conversation.get("tags", []),
            summary=conversation.get("summary")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_conversation_failed", conversation_id=conversation_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversation"
        )

@router.post("/conversations", response_model=Conversation)
async def create_conversation(
    request: CreateConversationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new conversation"""
    try:
        conversation_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        conversation = {
            "id": conversation_id,
            "title": request.title,
            "created_at": now,
            "updated_at": now,
            "user_id": current_user.get("id"),
            "is_archived": False,
            "tags": [],
            "summary": None
        }
        
        conversations_db[conversation_id] = conversation
        
        logger.info("conversation_created", conversation_id=conversation_id, user_id=current_user.get("id"))
        
        return Conversation(
            id=conversation_id,
            title=request.title,
            messages=[],
            created_at=now,
            updated_at=now,
            user_id=current_user.get("id"),
            is_archived=False,
            tags=[],
            summary=None
        )
        
    except Exception as e:
        logger.error("create_conversation_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create conversation"
        )

@router.post("/messages", response_model=ChatMessage)
async def send_message(
    request: SendMessageRequest,
    current_user: dict = Depends(get_current_user),
    openai_service: OpenAIService = Depends(),
    search_service: SearchService = Depends(),
    agent_service: AgentService = Depends()
):
    """Send a message and get AI response"""
    try:
        # Validate input
        if not request.message.strip():
            raise ValidationError("Message cannot be empty")
        
        # Create or get conversation
        conversation_id = request.conversation_id
        if not conversation_id:
            # Create new conversation
            conv_title = request.message[:50] + "..." if len(request.message) > 50 else request.message
            new_conv = await create_conversation(
                CreateConversationRequest(title=conv_title), 
                current_user
            )
            conversation_id = new_conv.id
        
        # Add user message
        user_message_id = str(uuid.uuid4())
        user_message = {
            "id": user_message_id,
            "content": request.message,
            "role": "user",
            "timestamp": datetime.utcnow(),
            "conversation_id": conversation_id,
            "metadata": None,
            "citations": None,
            "tools_used": None,
            "tokens_used": None
        }
        messages_db[user_message_id] = user_message
        
        # Get conversation history
        conversation_messages = [
            msg for msg in messages_db.values() 
            if msg.get("conversation_id") == conversation_id
        ]
        conversation_messages.sort(key=lambda x: x["timestamp"])
        
        # Generate AI response using agent service
        ai_response = await agent_service.process_message(
            message=request.message,
            conversation_history=conversation_messages,
            context=request.context,
            user_id=current_user.get("id")
        )
        
        # Add AI message
        ai_message_id = str(uuid.uuid4())
        ai_message = {
            "id": ai_message_id,
            "content": ai_response.content,
            "role": "assistant",
            "timestamp": datetime.utcnow(),
            "conversation_id": conversation_id,
            "metadata": ai_response.metadata,
            "citations": ai_response.citations,
            "tools_used": ai_response.tools_used,
            "tokens_used": ai_response.tokens_used
        }
        messages_db[ai_message_id] = ai_message
        
        # Update conversation timestamp
        if conversation_id in conversations_db:
            conversations_db[conversation_id]["updated_at"] = datetime.utcnow()
        
        logger.info(
            "message_processed",
            conversation_id=conversation_id,
            user_id=current_user.get("id"),
            tokens_used=ai_response.tokens_used.get("total_tokens") if ai_response.tokens_used else 0
        )
        
        return ChatMessage(**ai_message)
        
    except ValidationError:
        raise
    except Exception as e:
        logger.error("send_message_failed", error=str(e))
        raise ModelError("Failed to process message")

@router.post("/messages/stream")
async def send_message_stream(
    request: SendMessageRequest,
    current_user: dict = Depends(get_current_user),
    agent_service: AgentService = Depends()
):
    """Send a message and get streaming AI response"""
    try:
        # Validate input
        if not request.message.strip():
            raise ValidationError("Message cannot be empty")
        
        # Create or get conversation
        conversation_id = request.conversation_id
        if not conversation_id:
            conv_title = request.message[:50] + "..." if len(request.message) > 50 else request.message
            new_conv = await create_conversation(
                CreateConversationRequest(title=conv_title), 
                current_user
            )
            conversation_id = new_conv.id
        
        # Add user message
        user_message_id = str(uuid.uuid4())
        user_message = {
            "id": user_message_id,
            "content": request.message,
            "role": "user",
            "timestamp": datetime.utcnow(),
            "conversation_id": conversation_id,
            "metadata": None,
            "citations": None,
            "tools_used": None,
            "tokens_used": None
        }
        messages_db[user_message_id] = user_message
        
        # Get conversation history
        conversation_messages = [
            msg for msg in messages_db.values() 
            if msg.get("conversation_id") == conversation_id
        ]
        conversation_messages.sort(key=lambda x: x["timestamp"])
        
        async def generate_stream():
            ai_message_id = str(uuid.uuid4())
            full_response = ""
            
            try:
                async for chunk in agent_service.process_message_stream(
                    message=request.message,
                    conversation_history=conversation_messages,
                    context=request.context,
                    user_id=current_user.get("id")
                ):
                    full_response += chunk.delta
                    
                    response = StreamResponse(
                        delta=chunk.delta,
                        conversation_id=conversation_id,
                        message_id=ai_message_id,
                        is_final=chunk.is_final,
                        metadata=chunk.metadata
                    )
                    
                    yield f"data: {json.dumps(response.dict())}\n\n"
                    
                    if chunk.is_final:
                        # Save final message
                        ai_message = {
                            "id": ai_message_id,
                            "content": full_response,
                            "role": "assistant",
                            "timestamp": datetime.utcnow(),
                            "conversation_id": conversation_id,
                            "metadata": chunk.metadata,
                            "citations": getattr(chunk, 'citations', None),
                            "tools_used": getattr(chunk, 'tools_used', None),
                            "tokens_used": getattr(chunk, 'tokens_used', None)
                        }
                        messages_db[ai_message_id] = ai_message
                        
                        # Update conversation timestamp
                        if conversation_id in conversations_db:
                            conversations_db[conversation_id]["updated_at"] = datetime.utcnow()
                        
                        break
                        
                yield "data: [DONE]\n\n"
                
            except Exception as e:
                logger.error("streaming_failed", error=str(e))
                error_response = StreamResponse(
                    delta="",
                    conversation_id=conversation_id,
                    message_id=ai_message_id,
                    is_final=True,
                    metadata={"error": str(e)}
                )
                yield f"data: {json.dumps(error_response.dict())}\n\n"
                yield "data: [DONE]\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
        
    except ValidationError:
        raise
    except Exception as e:
        logger.error("send_message_stream_failed", error=str(e))
        raise ModelError("Failed to process streaming message")

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a conversation"""
    try:
        conversation = conversations_db.get(conversation_id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        if conversation["user_id"] != current_user.get("id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Delete conversation and its messages
        del conversations_db[conversation_id]
        
        # Delete messages
        message_ids_to_delete = [
            msg_id for msg_id, msg in messages_db.items()
            if msg.get("conversation_id") == conversation_id
        ]
        
        for msg_id in message_ids_to_delete:
            del messages_db[msg_id]
        
        logger.info("conversation_deleted", conversation_id=conversation_id, user_id=current_user.get("id"))
        
        return {"message": "Conversation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("delete_conversation_failed", conversation_id=conversation_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete conversation"
        )
