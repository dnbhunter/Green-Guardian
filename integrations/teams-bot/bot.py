"""
Microsoft Teams Bot integration for Green Guardian
"""

import asyncio
import json
import sys
from typing import Any, Dict
from botbuilder.core import (
    ActivityHandler,
    TurnContext,
    MessageFactory,
    CardFactory,
    ActionTypes
)
from botbuilder.schema import (
    Activity,
    ActivityTypes,
    Attachment,
    CardAction,
    HeroCard,
    SuggestedActions
)
import httpx
import structlog

logger = structlog.get_logger(__name__)

class GreenGuardianBot(ActivityHandler):
    """Green Guardian Teams Bot"""
    
    def __init__(self, api_base_url: str = "http://localhost:8000"):
        self.api_base_url = api_base_url
        self.api_client = httpx.AsyncClient(base_url=api_base_url)
        
    async def on_message_activity(self, turn_context: TurnContext) -> None:
        """Handle incoming messages"""
        try:
            user_message = turn_context.activity.text.strip()
            user_id = turn_context.activity.from_property.id
            user_name = turn_context.activity.from_property.name
            
            logger.info(
                "teams_message_received",
                user_id=user_id,
                user_name=user_name,
                message=user_message
            )
            
            # Show typing indicator
            typing_activity = MessageFactory.text("")
            typing_activity.type = ActivityTypes.typing
            await turn_context.send_activity(typing_activity)
            
            # Process message through Green Guardian API
            response = await self._process_with_api(user_message, user_id)
            
            if response:
                # Send response with rich formatting
                await self._send_formatted_response(turn_context, response)
            else:
                await turn_context.send_activity(
                    MessageFactory.text("I'm sorry, I couldn't process your request right now. Please try again later.")
                )
                
        except Exception as e:
            logger.error("teams_message_error", error=str(e))
            await turn_context.send_activity(
                MessageFactory.text("I encountered an error processing your request. Please try again.")
            )
    
    async def on_welcome_activity(self, turn_context: TurnContext) -> None:
        """Handle welcome/hello messages"""
        welcome_card = self._create_welcome_card()
        welcome_message = MessageFactory.attachment(welcome_card)
        await turn_context.send_activity(welcome_message)
    
    async def on_members_added_activity(self, members_added, turn_context: TurnContext) -> None:
        """Handle new members added"""
        for member in members_added:
            if member.id != turn_context.activity.recipient.id:
                await self.on_welcome_activity(turn_context)
    
    async def _process_with_api(self, message: str, user_id: str) -> Dict[str, Any]:
        """Process message through Green Guardian API"""
        try:
            payload = {
                "message": message,
                "context": {
                    "source": "teams",
                    "user_id": user_id
                }
            }
            
            # Mock authentication token (replace with proper Teams auth)
            headers = {
                "Authorization": "Bearer teams-bot-token",
                "Content-Type": "application/json"
            }
            
            response = await self.api_client.post(
                "/api/v1/chat/messages",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error("api_request_failed", status_code=response.status_code)
                return None
                
        except Exception as e:
            logger.error("api_request_error", error=str(e))
            return None
    
    async def _send_formatted_response(self, turn_context: TurnContext, response: Dict[str, Any]) -> None:
        """Send formatted response to Teams"""
        content = response.get("content", "")
        citations = response.get("citations", [])
        tools_used = response.get("tools_used", [])
        
        # Send main response
        await turn_context.send_activity(MessageFactory.text(content))
        
        # Send citations if available
        if citations:
            citation_card = self._create_citation_card(citations)
            citation_message = MessageFactory.attachment(citation_card)
            await turn_context.send_activity(citation_message)
        
        # Send suggested actions
        suggested_actions = self._create_suggested_actions()
        suggestion_message = MessageFactory.suggested_actions(
            suggested_actions,
            "What would you like to explore next?"
        )
        await turn_context.send_activity(suggestion_message)
    
    def _create_welcome_card(self) -> Attachment:
        """Create welcome card"""
        card = HeroCard(
            title="🌱 Welcome to Green Guardian!",
            subtitle="Your AI Sustainability Copilot",
            text="I can help you analyze ESG risks, review portfolio sustainability, and provide actionable insights. Try asking me about deforestation risks or carbon footprints!",
            images=[],
            buttons=[
                CardAction(
                    type=ActionTypes.message_back,
                    title="Portfolio Risks",
                    text="Show me portfolio sustainability risks"
                ),
                CardAction(
                    type=ActionTypes.message_back,
                    title="ESG Analysis",
                    text="Analyze ESG performance of our investments"
                ),
                CardAction(
                    type=ActionTypes.message_back,
                    title="Climate Data",
                    text="What climate risks should we be aware of?"
                )
            ]
        )
        return CardFactory.hero_card(card)
    
    def _create_citation_card(self, citations: list) -> Attachment:
        """Create citation card"""
        citation_text = "**Sources:**\n\n"
        for i, citation in enumerate(citations[:3]):  # Limit to top 3
            citation_text += f"[{i+1}] **{citation.get('title', 'Unknown')}**\n"
            citation_text += f"Source: {citation.get('source', 'Unknown')}\n"
            citation_text += f"Relevance: {citation.get('relevance_score', 0)*100:.0f}%\n\n"
        
        card = HeroCard(
            title="📚 Reference Sources",
            text=citation_text
        )
        return CardFactory.hero_card(card)
    
    def _create_suggested_actions(self) -> SuggestedActions:
        """Create suggested actions"""
        return SuggestedActions(
            actions=[
                CardAction(
                    type=ActionTypes.im_back,
                    title="🌳 Deforestation Risks",
                    value="Show companies with high deforestation exposure"
                ),
                CardAction(
                    type=ActionTypes.im_back,
                    title="📊 ESG Dashboard",
                    value="Open ESG portfolio dashboard"
                ),
                CardAction(
                    type=ActionTypes.im_back,
                    title="📈 Generate Report",
                    value="Create sustainability impact report"
                ),
                CardAction(
                    type=ActionTypes.im_back,
                    title="❓ Help",
                    value="What can you help me with?"
                )
            ]
        )
