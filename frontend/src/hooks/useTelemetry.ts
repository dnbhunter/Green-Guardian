import { useCallback } from 'react';
import { createTelemetryService } from '../services/telemetry';

export const useTelemetry = () => {
  const telemetryService = createTelemetryService();

  const trackEvent = useCallback((
    name: string, 
    properties?: Record<string, any>, 
    measurements?: Record<string, number>
  ) => {
    telemetryService.trackEvent(name, properties, measurements);
  }, [telemetryService]);

  const trackException = useCallback((
    error: Error, 
    severityLevel?: number, 
    properties?: Record<string, any>
  ) => {
    telemetryService.trackException(error, severityLevel, properties);
  }, [telemetryService]);

  const trackPageView = useCallback((
    name: string, 
    url?: string, 
    properties?: Record<string, any>
  ) => {
    telemetryService.trackPageView(name, url, properties);
  }, [telemetryService]);

  const trackMetric = useCallback((
    name: string, 
    average: number, 
    sampleCount?: number, 
    min?: number, 
    max?: number, 
    properties?: Record<string, any>
  ) => {
    telemetryService.trackMetric(name, average, sampleCount, min, max, properties);
  }, [telemetryService]);

  const trackChatInteraction = useCallback((
    action: 'send_message' | 'create_conversation' | 'select_conversation',
    properties?: Record<string, any>
  ) => {
    trackEvent(`chat_${action}`, {
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }, [trackEvent]);

  const trackDataInteraction = useCallback((
    action: 'view_company' | 'select_portfolio' | 'filter_assets' | 'upload_dataset',
    properties?: Record<string, any>
  ) => {
    trackEvent(`data_${action}`, {
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }, [trackEvent]);

  const trackNavigation = useCallback((
    page: string,
    properties?: Record<string, any>
  ) => {
    trackPageView(page, window.location.href, {
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }, [trackPageView]);

  const trackPerformance = useCallback((
    operation: string,
    duration: number,
    success: boolean,
    properties?: Record<string, any>
  ) => {
    trackMetric(`performance_${operation}_duration`, duration, 1, undefined, undefined, {
      success,
      timestamp: new Date().toISOString(),
      ...properties,
    });
    
    trackEvent(`performance_${operation}`, {
      duration,
      success,
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }, [trackMetric, trackEvent]);

  const trackError = useCallback((
    error: Error,
    context: string,
    properties?: Record<string, any>
  ) => {
    trackException(error, 3, { // Error level
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...properties,
    });
  }, [trackException]);

  const trackUserAction = useCallback((
    action: string,
    properties?: Record<string, any>
  ) => {
    trackEvent('user_action', {
      action,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...properties,
    });
  }, [trackEvent]);

  const trackSearchQuery = useCallback((
    query: string,
    resultsCount: number,
    searchType: 'companies' | 'assets' | 'chat',
    properties?: Record<string, any>
  ) => {
    trackEvent('search_query', {
      query: query.length > 100 ? query.substring(0, 100) + '...' : query,
      query_length: query.length,
      results_count: resultsCount,
      search_type: searchType,
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }, [trackEvent]);

  const flush = useCallback(() => {
    telemetryService.flush();
  }, [telemetryService]);

  return {
    trackEvent,
    trackException,
    trackPageView,
    trackMetric,
    trackChatInteraction,
    trackDataInteraction,
    trackNavigation,
    trackPerformance,
    trackError,
    trackUserAction,
    trackSearchQuery,
    flush,
  };
};
