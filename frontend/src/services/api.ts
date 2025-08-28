import { User, LoginResponse } from '../types/auth';
import { ChatMessage, SendMessageRequest, Conversation, StreamResponse } from '../types/chat';
import { Company, Asset, Portfolio, Dataset } from '../types/data';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  private async streamRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ReadableStream<StreamResponse>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    return new ReadableStream({
      start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        function pump(): Promise<void> {
          return reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6);
                if (data === '[DONE]') {
                  controller.close();
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  controller.enqueue(parsed);
                } catch (e) {
                  console.error('Failed to parse SSE data:', data);
                }
              }
            }

            return pump();
          });
        }

        return pump();
      },
    });
  }

  // Auth APIs
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  // Chat APIs
  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/chat/conversations');
  }

  async getConversation(id: string): Promise<Conversation> {
    return this.request<Conversation>(`/chat/conversations/${id}`);
  }

  async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
    return this.request<ChatMessage>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async sendMessageStream(request: SendMessageRequest): Promise<ReadableStream<StreamResponse>> {
    return this.streamRequest('/chat/messages/stream', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async createConversation(title: string): Promise<Conversation> {
    return this.request<Conversation>('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async deleteConversation(id: string): Promise<void> {
    await this.request(`/chat/conversations/${id}`, {
      method: 'DELETE',
    });
  }

  // Data APIs
  async getCompanies(): Promise<Company[]> {
    return this.request<Company[]>('/data/companies');
  }

  async getAssets(): Promise<Asset[]> {
    return this.request<Asset[]>('/data/assets');
  }

  async getPortfolios(): Promise<Portfolio[]> {
    return this.request<Portfolio[]>('/data/portfolios');
  }

  async getDatasets(): Promise<Dataset[]> {
    return this.request<Dataset[]>('/data/datasets');
  }

  async getCompany(id: string): Promise<Company> {
    return this.request<Company>(`/data/companies/${id}`);
  }

  async searchAssets(query: string): Promise<Asset[]> {
    return this.request<Asset[]>(`/search/assets?q=${encodeURIComponent(query)}`);
  }

  async getRiskScores(companyId: string): Promise<any> {
    return this.request(`/data/companies/${companyId}/risk-scores`);
  }

  // Admin APIs
  async getSystemMetrics(): Promise<any> {
    return this.request('/admin/metrics');
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/admin/users');
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.request<User>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Ingest APIs
  async uploadDataset(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/ingest/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getIngestionStatus(jobId: string): Promise<any> {
    return this.request(`/ingest/status/${jobId}`);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
