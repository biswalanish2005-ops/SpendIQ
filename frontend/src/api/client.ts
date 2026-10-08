const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

/** Default request timeout in milliseconds */
const DEFAULT_TIMEOUT_MS = 30_000;

/** Generate a lightweight request correlation ID */
function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ApiClientError extends Error {
  public status: number;
  public data?: unknown;
  public requestId?: string;

  constructor(status: number, message: string, data?: unknown, requestId?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.data = data;
    this.requestId = requestId;
  }
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('spendiq_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('spendiq_token', token);
    } else {
      localStorage.removeItem('spendiq_token');
    }
  }

  public getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('spendiq_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs = DEFAULT_TIMEOUT_MS
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();
    const requestId = generateRequestId();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Request-ID': requestId,
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // AbortController for request timeout
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutHandle);

      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        try {
          const authRes = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Request-ID': generateRequestId() },
            body: JSON.stringify({
              email: 'demo@spendiq.ai',
              password: 'DemoPass123!',
            }),
          });
          if (authRes.ok) {
            const authData = await authRes.json();
            this.setToken(authData.access_token);
            headers['Authorization'] = `Bearer ${authData.access_token}`;
            const retryRes = await fetch(url, { ...options, headers });
            if (retryRes.ok) {
              return await retryRes.json();
            }
          }
        } catch {
          // Fall through to error
        }
      }

      if (!response.ok) {
        let errorData: Record<string, unknown> = {};
        try {
          errorData = await response.json();
        } catch {
          // Non-JSON body
        }
        const serverRequestId = response.headers.get('X-Request-ID') || requestId;
        throw new ApiClientError(
          response.status,
          (errorData.message as string) || (errorData.detail as string) || `Request failed with status ${response.status}`,
          errorData,
          serverRequestId
        );
      }

      return await response.json();
    } catch (err: unknown) {
      clearTimeout(timeoutHandle);

      if (err instanceof ApiClientError) {
        throw err;
      }

      // Handle AbortController timeout specifically
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiClientError(0, `Request timed out after ${timeoutMs / 1000}s`, undefined, requestId);
      }

      const message = err instanceof Error ? err.message : 'Network connection failed';
      throw new ApiClientError(0, message, undefined, requestId);
    }
  }

  public get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
