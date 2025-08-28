import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ChatMessage, Conversation, ChatState, SendMessageRequest, StreamResponse } from '../types/chat';
import { apiClient } from '../services/api';

interface ChatActions {
  loadConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<string>;
  selectConversation: (id: string) => Promise<void>;
  sendMessage: (message: string, useStream?: boolean) => Promise<void>;
  updateCurrentMessage: (message: string) => void;
  clearCurrentMessage: () => void;
  deleteConversation: (id: string) => Promise<void>;
  addSuggestion: (suggestion: string) => void;
  clearSuggestions: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    conversations: [],
    activeConversationId: null,
    currentMessage: '',
    isLoading: false,
    isStreaming: false,
    error: null,
    suggestions: [],

    // Actions
    loadConversations: async () => {
      set({ isLoading: true, error: null });
      
      try {
        const conversations = await apiClient.getConversations();
        set({ 
          conversations, 
          isLoading: false 
        });
      } catch (error) {
        console.error('Failed to load conversations:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load conversations',
          isLoading: false 
        });
      }
    },

    createConversation: async (title?: string) => {
      set({ isLoading: true, error: null });
      
      try {
        const conversation = await apiClient.createConversation(title || 'New Conversation');
        
        set(state => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: conversation.id,
          isLoading: false,
        }));

        return conversation.id;
      } catch (error) {
        console.error('Failed to create conversation:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create conversation',
          isLoading: false 
        });
        throw error;
      }
    },

    selectConversation: async (id: string) => {
      const { conversations } = get();
      const existingConversation = conversations.find(c => c.id === id);
      
      if (existingConversation) {
        set({ activeConversationId: id });
        return;
      }

      set({ isLoading: true, error: null });
      
      try {
        const conversation = await apiClient.getConversation(id);
        
        set(state => ({
          conversations: [conversation, ...state.conversations.filter(c => c.id !== id)],
          activeConversationId: id,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Failed to load conversation:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load conversation',
          isLoading: false 
        });
      }
    },

    sendMessage: async (message: string, useStream = true) => {
      const { activeConversationId, conversations } = get();
      
      if (!message.trim()) return;

      // Create conversation if none exists
      let conversationId = activeConversationId;
      if (!conversationId) {
        conversationId = await get().createConversation();
      }

      const request: SendMessageRequest = {
        message: message.trim(),
        conversation_id: conversationId,
      };

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        content: message,
        role: 'user',
        timestamp: new Date(),
        conversation_id: conversationId,
      };

      set(state => ({
        conversations: state.conversations.map(conv =>
          conv.id === conversationId
            ? { ...conv, messages: [...conv.messages, userMessage] }
            : conv
        ),
        currentMessage: '',
        isLoading: !useStream,
        isStreaming: useStream,
        error: null,
      }));

      try {
        if (useStream) {
          // Handle streaming response
          const stream = await apiClient.sendMessageStream(request);
          const reader = stream.getReader();
          
          let assistantMessage: ChatMessage = {
            id: `stream-${Date.now()}`,
            content: '',
            role: 'assistant',
            timestamp: new Date(),
            conversation_id: conversationId,
          };

          // Add assistant message placeholder
          set(state => ({
            conversations: state.conversations.map(conv =>
              conv.id === conversationId
                ? { ...conv, messages: [...conv.messages, assistantMessage] }
                : conv
            ),
          }));

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const response: StreamResponse = value;
            assistantMessage.content += response.delta;

            set(state => ({
              conversations: state.conversations.map(conv =>
                conv.id === conversationId
                  ? {
                      ...conv,
                      messages: conv.messages.map(msg =>
                        msg.id === assistantMessage.id
                          ? { ...assistantMessage }
                          : msg
                      ),
                    }
                  : conv
              ),
            }));

            if (response.is_final) {
              assistantMessage.id = response.message_id;
              assistantMessage.metadata = response.metadata;
              break;
            }
          }

          set({ isStreaming: false });
        } else {
          // Handle regular response
          const response = await apiClient.sendMessage(request);
          
          set(state => ({
            conversations: state.conversations.map(conv =>
              conv.id === conversationId
                ? { ...conv, messages: [...conv.messages, response] }
                : conv
            ),
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to send message',
          isLoading: false,
          isStreaming: false,
        });
      }
    },

    updateCurrentMessage: (message: string) => {
      set({ currentMessage: message });
    },

    clearCurrentMessage: () => {
      set({ currentMessage: '' });
    },

    deleteConversation: async (id: string) => {
      try {
        await apiClient.deleteConversation(id);
        
        set(state => ({
          conversations: state.conversations.filter(c => c.id !== id),
          activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
        }));
      } catch (error) {
        console.error('Failed to delete conversation:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete conversation'
        });
      }
    },

    addSuggestion: (suggestion: string) => {
      set(state => ({
        suggestions: [...state.suggestions, suggestion],
      }));
    },

    clearSuggestions: () => {
      set({ suggestions: [] });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    clearError: () => {
      set({ error: null });
    },
  }))
);
