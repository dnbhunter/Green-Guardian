import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../state/chatSlice';
import { ChatMessage, Citation, ToolExecution } from '../types/chat';
import { useAuth } from '../hooks/useAuth';

interface MessageItemProps {
  message: ChatMessage;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center mb-4">
        <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-4 py-2 rounded-lg text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-3xl ${isUser ? 'ml-auto' : 'mr-auto'}`}>
        <div className="flex items-start space-x-3">
          {!isUser && (
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-dnb-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">🤖</span>
              </div>
            </div>
          )}
          
          <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
            <div
              className={`
                inline-block px-4 py-3 rounded-lg text-sm
                ${isUser
                  ? 'bg-dnb-green-600 text-white rounded-br-none'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                }
              `}
            >
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {message.content.split('\n').map((line, index) => (
                  <p key={index} className={`${index === 0 ? '' : 'mt-2'} ${isUser ? 'text-white' : ''}`}>
                    {line}
                  </p>
                ))}
              </div>
            </div>

            {/* Citations */}
            {message.citations && message.citations.length > 0 && (
              <div className="mt-3 space-y-2">
                <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Sources
                </h4>
                {message.citations.map((citation: Citation, index: number) => (
                  <div
                    key={citation.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          [{index + 1}] {citation.title}
                        </h5>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {citation.excerpt}
                        </p>
                        <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-500">
                          <span className="flex items-center">
                            📄 {citation.document_type}
                          </span>
                          <span>
                            Relevance: {Math.round(citation.relevance_score * 100)}%
                          </span>
                        </div>
                      </div>
                      {citation.url && (
                        <a
                          href={citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-dnb-green-600 hover:text-dnb-green-700 dark:text-dnb-green-400 dark:hover:text-dnb-green-300"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tools used */}
            {message.tools_used && message.tools_used.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Tools Used
                </h4>
                <div className="flex flex-wrap gap-2">
                  {message.tools_used.map((tool: ToolExecution, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    >
                      🔧 {tool.tool_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Token usage */}
            {message.tokens_used && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Tokens: {message.tokens_used.total_tokens} • 
                Cost: ${message.tokens_used.estimated_cost_usd.toFixed(4)}
              </div>
            )}

            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {new Date(message.timestamp).toLocaleString()}
              {message.metadata?.processing_time_ms && (
                <span> • {message.metadata.processing_time_ms}ms</span>
              )}
            </div>
          </div>

          {isUser && (
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-gray-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">👤</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface MessageListProps {
  className?: string;
}

const MessageList: React.FC<MessageListProps> = ({ className = '' }) => {
  const { conversations, activeConversationId } = useChatStore();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center ${className}`}>
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🌱</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to Green Guardian
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Hi {user?.name?.split(' ')[0] || 'there'}! I'm your AI sustainability copilot. 
            Ask me anything about ESG data, portfolio risks, or sustainability insights.
          </p>
          <div className="text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Try asking:</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• "Which companies in our portfolio have high deforestation risk?"</li>
              <li>• "Show me the carbon footprint of our energy sector investments"</li>
              <li>• "What are the top ESG risks in emerging markets?"</li>
              <li>• "Generate a sustainability report for Q4"</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-y-auto ${className}`}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
