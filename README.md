# 🌱 Green Guardian - DNB's AI Sustainability Copilot

[![CI](https://github.com/dnb/green-guardian/actions/workflows/ci.yml/badge.svg)](https://github.com/dnb/green-guardian/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Green Guardian is a unified AI assistant designed to help DNB "make life simpler for people and businesses while nurturing our planet." It combines generative AI and cloud services to boost employee productivity, provide actionable sustainability insights, and drive innovation.

## 🎯 Features

- 🤖 **AI Chat Interface** - Natural language conversations about sustainability insights
- 📊 **ESG Analytics** - Real-time analysis of portfolio risks and opportunities  
- 🗺️ **Geospatial Insights** - Interactive maps with deforestation and climate risk data
- 📈 **Portfolio Screening** - Automated ESG scoring and recommendations
- 🔍 **Document Search** - RAG-powered search across sustainability datasets
- 📱 **Multi-Platform** - Web app, Teams bot, and Slack integration
- 🛡️ **Enterprise Security** - Azure AD authentication with RBAC
- 📊 **Rich Dashboards** - Interactive charts and risk visualizations

## 🏗️ Architecture

![Architecture Diagram](docs/architecture-diagram.png)

### Technology Stack

**Frontend:**
- HTML5, CSS3, Vanilla JavaScript
- Served directly by FastAPI

**Backend:**
- Python 3.11 + FastAPI + Pydantic v2
- Azure OpenAI (GPT-4 + Function Calling)
- Azure Cognitive Search (Vector + Hybrid Search)
- LangChain + LangGraph (Agentic Workflows)
- PostgreSQL + Redis (Data & Caching)

**Infrastructure:**
- Azure Container Apps / App Service
- Azure Storage + Blob Containers
- Azure Key Vault (Secrets Management)
- Azure API Management (Rate Limiting)
- Azure Application Insights (Monitoring)

**Data Sources:**
- Forest IQ (Deforestation Risk Data)
- Spatial Finance Initiative (Geospatial ESG)
- Custom ESG datasets (CSV/JSON)
- DNB Portfolio data

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- Azure CLI
- Git

### 1. Clone & Setup

```bash
git clone https://github.com/dnb/green-guardian.git
cd green-guardian

# Install dependencies
cd backend && pip install -r requirements.txt && cd ..
```

### 2. Environment Configuration

Copy the environment template and configure your Azure resources:

```bash
cp .env.example .env
```

**Environment Variables:**

```env
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-openai-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-openai-api-key
AZURE_OPENAI_API_VERSION=2023-12-01-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-ada-002

# Azure Cognitive Search  
AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_SEARCH_API_KEY=your-search-admin-key
AZURE_SEARCH_INDEX_NAME=green-guardian-index

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=yourstorage;AccountKey=yourkey==;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=documents

# Azure Application Insights
APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=your-key;IngestionEndpoint=https://...

# Authentication
AZURE_CLIENT_ID=your-azure-ad-client-id
AZURE_TENANT_ID=your-azure-ad-tenant-id
SECRET_KEY=your-jwt-secret-key

# API Management (Optional)
APIM_GATEWAY_URL=https://your-apim.azure-api.net
APIM_SUBSCRIPTION_KEY=your-subscription-key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/green_guardian

# Redis Cache
REDIS_URL=redis://localhost:6379/0
```

### 3. Infrastructure Deployment

Deploy Azure resources using Bicep:

```bash
# Login to Azure
az login

# Create resource group
az group create --name rg-green-guardian-dev --location "East US"

# Deploy infrastructure
az deployment group create \
  --resource-group rg-green-guardian-dev \
  --template-file infra/main.bicep \
  --parameters @infra/parameters/dev.json
```

### 4. Database Setup

```bash
cd backend

# Run migrations
alembic upgrade head

# Seed sample data
python seed_data.py
```

### 5. Run Development Servers

**Backend:**
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Access the application:**
- Web Interface: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build the backend image
docker build -t green-guardian/backend ./backend
```

## 📊 Demo Script

### Sample Interactions

1. **Portfolio Risk Analysis**
   ```
   User: "Which companies in our portfolio have high deforestation risk in Brazil?"
   
   AI: "Based on Forest IQ data, I've identified 3 companies with high deforestation exposure:
   
   🔴 Company A (Agribusiness) - Risk Score: 8.2/10
   - 15,000 hectares in Amazon region
   - Recent deforestation alerts detected
   - Recommendation: Engage on zero-deforestation commitments
   
   🔴 Company B (Mining) - Risk Score: 7.8/10
   - Operations in Cerrado savanna
   - Biodiversity hotspot concerns
   - Recommendation: Review environmental management plans
   
   [Interactive map showing locations and risk heat zones]
   
   Would you like me to generate a detailed risk assessment report?"
   ```

2. **ESG Compliance Query**
   ```
   User: "Show me our portfolio's alignment with EU Taxonomy requirements"
   
   AI: "Analyzing your portfolio against EU Taxonomy criteria:
   
   📊 Current Alignment: 67%
   
   🟢 Eligible Activities: €2.3B (45% of portfolio)
   🟡 Aligned Activities: €1.8B (35% of portfolio)  
   🔴 Non-Aligned: €1.2B (22% of portfolio)
   
   Key Gaps:
   - Climate adaptation measures lacking in 12 investments
   - DNSH criteria not met for 8 energy companies
   - Social safeguards documentation incomplete
   
   [Detailed breakdown by sector and investment]
   
   Next Steps:
   1. Request updated DNSH assessments
   2. Engage portfolio companies on adaptation plans
   3. Review social impact documentation"
   ```

3. **Sustainability Report Generation**
   ```
   User: "Generate a Q4 2023 sustainability impact report"
   
   AI: "Generating comprehensive sustainability report...
   
   📈 Portfolio Impact Summary Q4 2023:
   
   🌱 Carbon Footprint: 2.1M tonnes CO2e (-12% vs Q3)
   💧 Water Risk Exposure: 23% of portfolio in water-stressed regions  
   🌳 Biodiversity Impact: 15% in critical habitat areas
   ⚡ Renewable Energy: 34% of energy investments (+8% vs Q3)
   
   [Generated 45-page PDF report with charts, maps, and recommendations]
   
   Key Achievements:
   - 3 new renewable energy investments
   - 2 fossil fuel divestments completed
   - 12 companies improved ESG ratings
   
   Report includes:
   - Executive summary
   - Detailed risk analysis
   - Portfolio alignment metrics
   - Forward-looking scenarios
   - Recommended actions
   
   Would you like me to schedule this for Board presentation?"
   ```

## 🧪 Testing

**Backend Tests:**
```bash
cd backend

# Unit tests with coverage
pytest tests/ -v --cov=app --cov-report=html

# Integration tests
pytest tests/integration/ -v

# Load tests
locust -f tests/load/locustfile.py --host=http://localhost:8000
```

## 📊 KQL Examples

### Token Usage Metrics

```kusto
// Daily token consumption by user
customEvents
| where name == "openai_response_generated"
| extend tokens = toint(customDimensions["tokens_used"])
| extend user_id = tostring(customDimensions["user_id"])
| summarize TotalTokens = sum(tokens), RequestCount = count() by user_id, bin(timestamp, 1d)
| order by timestamp desc

// Cost analysis by model
customEvents
| where name == "openai_response_generated"
| extend model = tostring(customDimensions["model"])
| extend tokens = toint(customDimensions["tokens_used"])
| extend cost = case(
    model == "gpt-4", tokens * 0.00003,
    model == "gpt-3.5-turbo", tokens * 0.000002,
    0.0
)
| summarize TotalCost = sum(cost), TotalTokens = sum(tokens) by model, bin(timestamp, 1h)
| render timechart
```

### Performance Monitoring

```kusto
// Average response times by endpoint
requests
| where name startswith "GET /api/v1/"
| summarize AvgDuration = avg(duration), Count = count() by name, bin(timestamp, 5m)
| render timechart

// Error rate analysis
requests  
| where timestamp > ago(24h)
| summarize Total = count(), Errors = countif(success == false) by bin(timestamp, 1h)
| extend ErrorRate = Errors * 100.0 / Total
| render timechart
```

## 🔧 Configuration

### Backend Configuration  

```python
# app/core/config.py
class Settings(BaseSettings):
    AZURE_OPENAI_ENDPOINT: str
    AZURE_OPENAI_API_KEY: str
    RATE_LIMIT_PER_MINUTE: int = 60
    
    class Config:
        env_file = ".env"
```

## 🔒 Security

- **Authentication**: Azure AD integration with PKCE flow
- **Authorization**: Role-based access control (Analyst, Admin, Auditor)  
- **API Security**: Rate limiting, input validation, output sanitization
- **Data Protection**: PII detection and redaction
- **Compliance**: Audit trails, content filtering, prompt injection guards

## 📈 Monitoring & Observability

- **Application Insights**: Request tracing, performance monitoring
- **Custom Metrics**: Token usage, user interactions, model performance
- **Structured Logging**: JSON logs with correlation IDs
- **Health Checks**: System status and dependency monitoring
- **Alerting**: Automated alerts for errors and performance issues

## 🧩 Integrations

### Microsoft Teams Bot

```python
# integrations/teams-bot/bot.py
from botbuilder.core import ActivityHandler, TurnContext
from botbuilder.schema import Activity, ActivityTypes

class GreenGuardianBot(ActivityHandler):
    async def on_message_activity(self, turn_context: TurnContext):
        # Forward to main chat API
        response = await chat_service.process_message(
            turn_context.activity.text,
            user_id=turn_context.activity.from_property.id
        )
        await turn_context.send_activity(response.content)
```

### Slack Integration

```python
# integrations/slack/app.py
from slack_bolt.async_app import AsyncApp

app = AsyncApp(token="your-bot-token")

@app.command("/green-guardian")
async def handle_command(ack, command, client):
    await ack()
    response = await chat_service.process_message(command["text"])
    await client.chat_postMessage(
        channel=command["channel_id"],
        text=response.content
    )
```

## 🎨 Architecture Diagram

```mermaid
graph TB
    U[Users] --> F[Frontend React App]
    U --> T[Teams Bot]
    U --> S[Slack Bot]
    
    F --> API[FastAPI Backend]
    T --> API
    S --> API
    
    API --> AI[Azure OpenAI]
    API --> SEARCH[Cognitive Search]
    API --> STORAGE[Blob Storage]
    API --> DB[(PostgreSQL)]
    API --> CACHE[(Redis)]
    
    SEARCH --> STORAGE
    API --> KV[Key Vault]
    API --> INSIGHTS[App Insights]
    
    EXT[External Data Sources] --> INGEST[Data Ingestion]
    INGEST --> STORAGE
    INGEST --> SEARCH
    
    subgraph "Data Sources"
        FOREST[Forest IQ]
        SPATIAL[Spatial Finance]
        ESG[ESG Datasets]
    end
    
    FOREST --> EXT
    SPATIAL --> EXT
    ESG --> EXT
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- DNB for the sustainability mission and hackathon opportunity
- Forest IQ for deforestation risk data
- Spatial Finance Initiative for geospatial ESG datasets
- Microsoft Azure for the AI and cloud infrastructure
- Open source community for the amazing tools and libraries

## 🔗 Links

- [Demo Video](https://youtu.be/demo-video)
- [Documentation](docs/)
- [API Reference](docs/api_reference.md)
- [Architecture Deep Dive](docs/architecture.md)
- [Development Setup](docs/setup.md)

---

**Built with ❤️ for DNB Hackathon 2024**

*Green Guardian v1.0 - Making sustainability insights accessible to everyone at DNB*
