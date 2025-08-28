import React, { useEffect } from 'react';
import { useChatStore } from '../state/chatSlice';
import { useTelemetry } from '../hooks/useTelemetry';
import ChatComposer from '../components/ChatComposer';
import MessageList from '../components/MessageList';

const Chat: React.FC = () => {
  const { loadConversations, createConversation, activeConversationId, conversations } = useChatStore();
  const { trackNavigation } = useTelemetry();

  useEffect(() => {
    trackNavigation('chat');
    
    // Load conversations on mount
    loadConversations().catch(console.error);

    // Create initial conversation if none exists
    if (conversations.length === 0 && !activeConversationId) {
      createConversation('New Conversation').catch(console.error);
    }
  }, [loadConversations, createConversation, activeConversationId, conversations.length, trackNavigation]);

  return (
    <div className="h-[calc(100vh-2.5rem)] flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-dnb-green-500 rounded-full flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Green Guardian AI
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your sustainability copilot
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <MessageList className="flex-1 bg-gray-50 dark:bg-gray-900" />

      {/* Chat Input */}
      <ChatComposer />
    </div>
  );
};

export default Chat;
