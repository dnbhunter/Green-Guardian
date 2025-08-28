export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  conversation_id: string;
  metadata?: ChatMessageMetadata;
  citations?: Citation[];
  tools_used?: ToolExecution[];
  tokens_used?: TokenUsage;
}

export interface ChatMessageMetadata {
  intent?: string;
  confidence?: number;
  language?: string;
  flagged_content?: boolean;
  processing_time_ms?: number;
  model_version?: string;
}

export interface Citation {
  id: string;
  title: string;
  source: string;
  url?: string;
  excerpt: string;
  relevance_score: number;
  document_type: 'pdf' | 'csv' | 'json' | 'web' | 'internal';
  metadata?: Record<string, any>;
}

export interface ToolExecution {
  tool_name: string;
  parameters: Record<string, any>;
  result?: any;
  error?: string;
  execution_time_ms: number;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: Date;
  updated_at: Date;
  user_id: string;
  is_archived: boolean;
  tags: string[];
  summary?: string;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  currentMessage: string;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  suggestions: string[];
}

export interface SendMessageRequest {
  message: string;
  conversation_id?: string;
  context?: ChatContext;
}

export interface ChatContext {
  portfolio_data?: any[];
  selected_companies?: string[];
  time_range?: {
    start: string;
    end: string;
  };
  sustainability_focus?: string[];
}

export interface StreamResponse {
  delta: string;
  conversation_id: string;
  message_id: string;
  is_final: boolean;
  metadata?: ChatMessageMetadata;
}
