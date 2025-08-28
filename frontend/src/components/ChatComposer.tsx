import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useChatStore } from '../state/chatSlice';
import { useTelemetry } from '../hooks/useTelemetry';

const messageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface ChatComposerProps {
  onSendMessage?: (message: string) => void;
  disabled?: boolean;
}

const ChatComposer: React.FC<ChatComposerProps> = ({ onSendMessage, disabled = false }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isLoading, isStreaming, currentMessage, updateCurrentMessage, suggestions } = useChatStore();
  const { trackChatInteraction } = useTelemetry();
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    mode: 'onChange',
    defaultValues: {
      message: currentMessage,
    },
  });

  const messageValue = watch('message');

  useEffect(() => {
    updateCurrentMessage(messageValue || '');
  }, [messageValue, updateCurrentMessage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [messageValue]);

  const onSubmit = async (data: MessageFormData) => {
    if (disabled || isLoading || isStreaming) return;

    try {
      trackChatInteraction('send_message', {
        message_length: data.message.length,
        has_suggestions: suggestions.length > 0,
      });

      if (onSendMessage) {
        onSendMessage(data.message);
      } else {
        await sendMessage(data.message);
      }
      
      reset();
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    reset({ message: suggestion });
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    trackChatInteraction('use_suggestion', { suggestion });
  };

  const isProcessing = isLoading || isStreaming;

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isProcessing}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="p-4">
        <div className="relative">
          <textarea
            ref={textareaRef}
            {...register('message')}
            placeholder="Ask about sustainability insights, portfolio risks, or ESG data..."
            disabled={disabled || isProcessing}
            onKeyDown={handleKeyDown}
            rows={1}
            className={`
              w-full resize-none border rounded-lg px-4 py-3 pr-16 focus:outline-none focus:ring-2 focus:ring-dnb-green-500 focus:border-transparent
              ${errors.message 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-300 dark:border-gray-600'
              }
              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
              placeholder-gray-500 dark:placeholder-gray-400
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
              max-h-32 overflow-y-auto
            `}
            style={{ minHeight: '48px' }}
          />
          
          <button
            type="submit"
            disabled={!isValid || disabled || isProcessing || !messageValue?.trim()}
            className={`
              absolute bottom-2 right-2 p-2 rounded-md transition-all duration-200
              ${isValid && messageValue?.trim() && !isProcessing
                ? 'bg-dnb-green-600 hover:bg-dnb-green-700 text-white'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }
              disabled:opacity-50
            `}
          >
            {isProcessing ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-current" />
            ) : (
              <svg 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                />
              </svg>
            )}
          </button>
        </div>

        {errors.message && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {errors.message.message}
          </p>
        )}

        <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
          <p>
            {messageValue?.length || 0}/2000 characters
          </p>
          <p>
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </form>

      {isProcessing && (
        <div className="px-4 pb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <div className="animate-pulse flex space-x-1">
              <div className="rounded-full bg-gray-400 dark:bg-gray-600 h-2 w-2"></div>
              <div className="rounded-full bg-gray-400 dark:bg-gray-600 h-2 w-2"></div>
              <div className="rounded-full bg-gray-400 dark:bg-gray-600 h-2 w-2"></div>
            </div>
            <span className="ml-2">
              {isStreaming ? 'AI is thinking...' : 'Sending message...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatComposer;
