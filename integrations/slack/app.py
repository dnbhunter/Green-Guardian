"""
Slack integration for Green Guardian
"""

import json
import asyncio
from typing import Dict, Any
from slack_bolt.async_app import AsyncApp
from slack_bolt.adapter.socket_mode.async_handler import AsyncSocketModeHandler
import httpx
import structlog

logger = structlog.get_logger(__name__)

# Initialize Slack app
app = AsyncApp(token="xoxb-your-bot-token")

# Green Guardian API client
api_client = httpx.AsyncClient(base_url="http://localhost:8000")

@app.command("/green-guardian")
async def handle_green_guardian_command(ack, command, client):
    """Handle /green-guardian slash command"""
    await ack()
    
    try:
        user_id = command["user_id"]
        user_name = command["user_name"]
        text = command["text"]
        channel_id = command["channel_id"]
        
        logger.info(
            "slack_command_received",
            user_id=user_id,
            user_name=user_name,
            command_text=text,
            channel_id=channel_id
        )
        
        # Send initial response
        await client.chat_postMessage(
            channel=channel_id,
            text="🌱 Processing your sustainability query...",
            user=user_id
        )
        
        # Process with Green Guardian API
        response = await process_with_api(text, user_id)
        
        if response:
            # Format response for Slack
            blocks = create_response_blocks(response)
            
            await client.chat_postMessage(
                channel=channel_id,
                text=response.get("content", "Here's your sustainability insight:"),
                blocks=blocks,
                user=user_id
            )
        else:
            await client.chat_postMessage(
                channel=channel_id,
                text="❌ I couldn't process your request right now. Please try again later.",
                user=user_id
            )
            
    except Exception as e:
        logger.error("slack_command_error", error=str(e))
        await client.chat_postMessage(
            channel=command["channel_id"],
            text="❌ I encountered an error processing your request.",
            user=command["user_id"]
        )

@app.event("app_mention")
async def handle_app_mention(event, client):
    """Handle @GreenGuardian mentions"""
    try:
        channel_id = event["channel"]
        user_id = event["user"]
        text = event.get("text", "").replace(f"<@{app.client.auth_test()['user_id']}>", "").strip()
        
        logger.info(
            "slack_mention_received",
            user_id=user_id,
            text=text,
            channel_id=channel_id
        )
        
        # Send typing indicator
        await client.conversations_join(channel=channel_id)
        
        # Process with API
        response = await process_with_api(text, user_id)
        
        if response:
            blocks = create_response_blocks(response)
            
            await client.chat_postMessage(
                channel=channel_id,
                text=response.get("content"),
                blocks=blocks,
                thread_ts=event.get("ts")  # Reply in thread
            )
        else:
            await client.chat_postMessage(
                channel=channel_id,
                text="I couldn't process your request right now.",
                thread_ts=event.get("ts")
            )
            
    except Exception as e:
        logger.error("slack_mention_error", error=str(e))

@app.shortcut("green_guardian_analysis")
async def handle_shortcut(ack, shortcut, client):
    """Handle Green Guardian shortcut"""
    await ack()
    
    # Open modal for detailed input
    modal_view = {
        "type": "modal",
        "callback_id": "green_guardian_modal",
        "title": {"type": "plain_text", "text": "🌱 Green Guardian"},
        "blocks": [
            {
                "type": "input",
                "block_id": "query_block",
                "element": {
                    "type": "plain_text_input",
                    "action_id": "query_input",
                    "multiline": True,
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Ask about sustainability risks, ESG analysis, or portfolio insights..."
                    }
                },
                "label": {"type": "plain_text", "text": "What would you like to know?"}
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Example queries:*\n• Which companies have high deforestation risk?\n• Show ESG performance of our energy investments\n• Generate a sustainability report for Q4"
                }
            }
        ],
        "submit": {"type": "plain_text", "text": "Analyze"}
    }
    
    await client.views_open(
        trigger_id=shortcut["trigger_id"],
        view=modal_view
    )

@app.view("green_guardian_modal")
async def handle_modal_submission(ack, body, view, client):
    """Handle modal form submission"""
    await ack()
    
    try:
        user_id = body["user"]["id"]
        channel_id = body["user"]["id"]  # DM the user
        
        # Extract query from modal
        query = view["state"]["values"]["query_block"]["query_input"]["value"]
        
        logger.info("slack_modal_submission", user_id=user_id, query=query)
        
        # Send initial response
        await client.chat_postMessage(
            channel=channel_id,
            text="🌱 Analyzing your sustainability query..."
        )
        
        # Process with API
        response = await process_with_api(query, user_id)
        
        if response:
            blocks = create_response_blocks(response)
            
            await client.chat_postMessage(
                channel=channel_id,
                text=response.get("content"),
                blocks=blocks
            )
        
    except Exception as e:
        logger.error("slack_modal_error", error=str(e))

async def process_with_api(message: str, user_id: str) -> Dict[str, Any]:
    """Process message through Green Guardian API"""
    try:
        payload = {
            "message": message,
            "context": {
                "source": "slack",
                "user_id": user_id
            }
        }
        
        headers = {
            "Authorization": "Bearer slack-bot-token",
            "Content-Type": "application/json"
        }
        
        response = await api_client.post(
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

def create_response_blocks(response: Dict[str, Any]) -> list:
    """Create Slack blocks for response"""
    blocks = []
    
    content = response.get("content", "")
    citations = response.get("citations", [])
    tools_used = response.get("tools_used", [])
    
    # Main response
    blocks.append({
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": content
        }
    })
    
    # Add citations if available
    if citations:
        citation_text = "*Sources:*\n"
        for i, citation in enumerate(citations[:3]):
            citation_text += f"• [{i+1}] {citation.get('title', 'Unknown Source')}\n"
        
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": citation_text
            }
        })
    
    # Add action buttons
    blocks.append({
        "type": "actions",
        "elements": [
            {
                "type": "button",
                "text": {"type": "plain_text", "text": "📊 View Dashboard"},
                "action_id": "view_dashboard",
                "style": "primary"
            },
            {
                "type": "button",
                "text": {"type": "plain_text", "text": "📈 Generate Report"},
                "action_id": "generate_report"
            },
            {
                "type": "button",
                "text": {"type": "plain_text", "text": "❓ Ask Follow-up"},
                "action_id": "ask_followup"
            }
        ]
    })
    
    return blocks

if __name__ == "__main__":
    # Run the Slack app
    handler = AsyncSocketModeHandler(app, "xapp-your-app-token")
    asyncio.run(handler.start_async())
