# 📊 KQL Examples for Green Guardian

This document provides KQL (Kusto Query Language) queries for monitoring and analyzing Green Guardian usage in Azure Application Insights and Log Analytics.

## 🎯 Token Usage & Cost Analysis

### Daily Token Consumption by User

```kusto
customEvents
| where name == "openai_response_generated"
| where timestamp >= ago(30d)
| extend tokens = toint(customDimensions["tokens_used"])
| extend user_id = tostring(customDimensions["user_id"])
| extend model = tostring(customDimensions["model"])
| where isnotnull(tokens) and tokens > 0
| summarize TotalTokens = sum(tokens), RequestCount = count() by user_id, bin(timestamp, 1d)
| order by timestamp desc, TotalTokens desc
```

### Cost Analysis by Model

```kusto
customEvents
| where name == "openai_response_generated"
| where timestamp >= ago(7d)
| extend model = tostring(customDimensions["model"])
| extend prompt_tokens = toint(customDimensions["prompt_tokens"])
| extend completion_tokens = toint(customDimensions["completion_tokens"])
| extend total_tokens = toint(customDimensions["total_tokens"])
| extend cost = case(
    model == "gpt-4", (prompt_tokens * 0.00003) + (completion_tokens * 0.00006),
    model == "gpt-3.5-turbo", (prompt_tokens * 0.0000015) + (completion_tokens * 0.000002),
    0.0
)
| summarize 
    TotalCost = sum(cost), 
    TotalTokens = sum(total_tokens),
    AvgTokensPerRequest = avg(total_tokens),
    RequestCount = count() 
by model, bin(timestamp, 1h)
| render timechart
```

### Per-Client Token Usage

```kusto
customEvents
| where name == "chat_message_processed" or name == "openai_response_generated"
| where timestamp >= ago(24h)
| extend client_id = tostring(customDimensions["user_id"])
| extend tokens = toint(customDimensions["tokens_used"])
| where isnotnull(client_id) and isnotnull(tokens)
| summarize 
    TotalTokens = sum(tokens),
    RequestCount = count(),
    AvgTokensPerRequest = avg(tokens),
    MaxTokensInRequest = max(tokens)
by client_id
| order by TotalTokens desc
| take 20
```

### Hourly Token Usage Trends

```kusto
customEvents
| where name == "openai_response_generated"
| where timestamp >= ago(7d)
| extend tokens = toint(customDimensions["tokens_used"])
| where tokens > 0
| summarize TokensUsed = sum(tokens), RequestCount = count() by bin(timestamp, 1h)
| render timechart 
    with (
        title="Token Usage Over Time",
        xtitle="Time",
        ytitle="Tokens Used"
    )
```

## 🚀 Performance Monitoring

### Average Response Times by Endpoint

```kusto
requests
| where name startswith "POST /api/v1/" or name startswith "GET /api/v1/"
| where timestamp >= ago(24h)
| summarize 
    AvgDuration = avg(duration),
    P50Duration = percentile(duration, 50),
    P95Duration = percentile(duration, 95),
    P99Duration = percentile(duration, 99),
    RequestCount = count()
by name, bin(timestamp, 5m)
| render timechart
```

### Error Rate Analysis

```kusto
requests
| where timestamp >= ago(24h)
| summarize 
    Total = count(),
    Errors = countif(success == false),
    ServerErrors = countif(resultCode >= 500),
    ClientErrors = countif(resultCode >= 400 and resultCode < 500)
by bin(timestamp, 1h)
| extend ErrorRate = Errors * 100.0 / Total
| extend ServerErrorRate = ServerErrors * 100.0 / Total
| render timechart
    with (
        title="Error Rates Over Time",
        xtitle="Time",
        ytitle="Error Rate (%)"
    )
```

### Slow Requests Analysis

```kusto
requests
| where duration > 5000  // Requests taking more than 5 seconds
| where timestamp >= ago(24h)
| project timestamp, name, duration, resultCode, customDimensions
| extend user_id = tostring(customDimensions["user_id"])
| extend conversation_id = tostring(customDimensions["conversation_id"])
| order by duration desc
| take 50
```

## 💬 Chat Analytics

### Most Popular Chat Topics

```kusto
customEvents
| where name == "chat_message_processed"
| where timestamp >= ago(7d)
| extend message_intent = tostring(customDimensions["intent"])
| extend confidence = todouble(customDimensions["confidence"])
| where isnotnull(message_intent) and confidence > 0.7
| summarize MessageCount = count(), AvgConfidence = avg(confidence) by message_intent
| order by MessageCount desc
```

### User Engagement Metrics

```kusto
customEvents
| where name == "chat_message_processed"
| where timestamp >= ago(30d)
| extend user_id = tostring(customDimensions["user_id"])
| extend conversation_id = tostring(customDimensions["conversation_id"])
| summarize 
    TotalMessages = count(),
    UniqueConversations = dcount(conversation_id),
    AvgMessagesPerConversation = count() * 1.0 / dcount(conversation_id),
    FirstMessage = min(timestamp),
    LastMessage = max(timestamp)
by user_id
| extend DaysActive = datetime_diff('day', LastMessage, FirstMessage) + 1
| order by TotalMessages desc
```

### Conversation Length Analysis

```kusto
customEvents
| where name == "chat_message_processed"
| where timestamp >= ago(7d)
| extend conversation_id = tostring(customDimensions["conversation_id"])
| summarize 
    MessageCount = count(),
    Duration = max(timestamp) - min(timestamp),
    UniqueUsers = dcount(tostring(customDimensions["user_id"]))
by conversation_id
| extend DurationMinutes = Duration / 1m
| summarize 
    AvgMessageCount = avg(MessageCount),
    AvgDurationMinutes = avg(DurationMinutes),
    P50MessageCount = percentile(MessageCount, 50),
    P95MessageCount = percentile(MessageCount, 95)
```

## 🔧 Tool Usage Analytics

### Most Used AI Tools

```kusto
customEvents
| where name == "tool_executed"
| where timestamp >= ago(7d)
| extend tool_name = tostring(customDimensions["tool_name"])
| extend execution_time = toint(customDimensions["execution_time_ms"])
| extend success = tobool(customDimensions["success"])
| summarize 
    UsageCount = count(),
    SuccessRate = countif(success) * 100.0 / count(),
    AvgExecutionTime = avg(execution_time),
    P95ExecutionTime = percentile(execution_time, 95)
by tool_name
| order by UsageCount desc
```

### Search Query Analysis

```kusto
customEvents
| where name == "search_query"
| where timestamp >= ago(7d)
| extend query = tostring(customDimensions["query"])
| extend results_count = toint(customDimensions["results_count"])
| extend search_type = tostring(customDimensions["search_type"])
| summarize 
    QueryCount = count(),
    AvgResultsCount = avg(results_count),
    ZeroResultQueries = countif(results_count == 0)
by search_type
| extend ZeroResultRate = ZeroResultQueries * 100.0 / QueryCount
```

## 🛡️ Security & Compliance

### Authentication Failures

```kusto
customEvents
| where name == "authentication_failed" or name == "authorization_failed"
| where timestamp >= ago(24h)
| extend user_id = tostring(customDimensions["user_id"])
| extend reason = tostring(customDimensions["reason"])
| extend ip_address = tostring(customDimensions["client_ip"])
| summarize FailureCount = count() by user_id, reason, ip_address, bin(timestamp, 1h)
| order by FailureCount desc
```

### Content Filter Triggers

```kusto
customEvents
| where name == "content_filtered"
| where timestamp >= ago(7d)
| extend filter_type = tostring(customDimensions["filter_type"])
| extend user_id = tostring(customDimensions["user_id"])
| extend content_length = toint(customDimensions["content_length"])
| summarize 
    TriggerCount = count(),
    UniqueUsers = dcount(user_id),
    AvgContentLength = avg(content_length)
by filter_type, bin(timestamp, 1d)
| render columnchart
```

### PII Detection Events

```kusto
customEvents
| where name == "pii_detected"
| where timestamp >= ago(7d)
| extend pii_type = tostring(customDimensions["pii_type"])
| extend confidence = todouble(customDimensions["confidence"])
| extend user_id = tostring(customDimensions["user_id"])
| where confidence > 0.8
| summarize DetectionCount = count(), AvgConfidence = avg(confidence) by pii_type
| order by DetectionCount desc
```

## 📊 Business Intelligence

### Data Source Usage

```kusto
customEvents
| where name == "data_source_accessed"
| where timestamp >= ago(30d)
| extend source_type = tostring(customDimensions["source_type"])
| extend dataset_name = tostring(customDimensions["dataset_name"])
| extend user_id = tostring(customDimensions["user_id"])
| summarize 
    AccessCount = count(),
    UniqueUsers = dcount(user_id),
    LastAccessed = max(timestamp)
by source_type, dataset_name
| order by AccessCount desc
```

### ESG Query Patterns

```kusto
customEvents
| where name == "chat_message_processed"
| where timestamp >= ago(30d)
| extend message_content = tostring(customDimensions["message"])
| extend user_id = tostring(customDimensions["user_id"])
| where message_content contains "ESG" or 
        message_content contains "sustainability" or
        message_content contains "deforestation" or
        message_content contains "carbon" or
        message_content contains "climate"
| extend topic = case(
    message_content contains "deforestation", "Deforestation",
    message_content contains "carbon" or message_content contains "climate", "Climate",
    message_content contains "ESG", "ESG General",
    "Sustainability General"
)
| summarize QueryCount = count(), UniqueUsers = dcount(user_id) by topic, bin(timestamp, 1d)
| render columnchart
```

## 🚨 Alerting Queries

### High Token Usage Alert

```kusto
customEvents
| where name == "openai_response_generated"
| where timestamp >= ago(1h)
| extend tokens = toint(customDimensions["tokens_used"])
| summarize TotalTokens = sum(tokens)
| where TotalTokens > 50000  // Alert if more than 50K tokens per hour
```

### High Error Rate Alert

```kusto
requests
| where timestamp >= ago(15m)
| summarize Total = count(), Errors = countif(success == false)
| extend ErrorRate = Errors * 100.0 / Total
| where ErrorRate > 5.0  // Alert if error rate > 5%
```

### Unusual User Activity

```kusto
customEvents
| where name == "chat_message_processed"
| where timestamp >= ago(1h)
| extend user_id = tostring(customDimensions["user_id"])
| summarize MessageCount = count() by user_id
| where MessageCount > 100  // Alert for users with >100 messages per hour
```

## 📈 Dashboard Queries

### Executive Dashboard - Key Metrics

```kusto
let timeRange = ago(24h);
let totalUsers = customEvents
    | where timestamp >= timeRange
    | where name == "user_action"
    | dcount(tostring(customDimensions["user_id"]));
let totalRequests = requests
    | where timestamp >= timeRange
    | count;
let avgResponseTime = requests
    | where timestamp >= timeRange
    | summarize avg(duration);
let totalTokens = customEvents
    | where timestamp >= timeRange
    | where name == "openai_response_generated"
    | extend tokens = toint(customDimensions["tokens_used"])
    | summarize sum(tokens);
print 
    ActiveUsers = totalUsers,
    TotalRequests = totalRequests,
    AvgResponseTimeMs = avgResponseTime,
    TotalTokensUsed = totalTokens
```

These KQL queries provide comprehensive monitoring and analytics capabilities for Green Guardian, enabling you to track usage, performance, costs, and business metrics effectively.
