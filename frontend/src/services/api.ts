// Centralized API client for communicating with Django REST backend

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface RequestOptions extends RequestInit {
  data?: any;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    // Retrieve stored session if available to support robust session persistence across tabs & restarts
    let sessionHeaders: Record<string, string> = {};
    try {
      const stored = localStorage.getItem('varimitra_user_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id) sessionHeaders['X-User-Id'] = String(parsed.id);
        if (parsed.identifier || parsed.name || parsed.mobile_number) {
          sessionHeaders['X-User-Identifier'] = parsed.identifier || parsed.mobile_number || parsed.name;
        }
        if (parsed.role) sessionHeaders['X-User-Role'] = parsed.role;
      }
    } catch {
      // Ignore localStorage errors
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...sessionHeaders,
      ...(options.headers as Record<string, string> || {}),
    };

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };

    if (options.data) {
      config.body = JSON.stringify(options.data);
    }

    try {
      const response = await fetch(url, config);
      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { raw: text };
      }

      if (!response.ok) {
        const errorMessage = data?.error || data?.detail || data?.message || `HTTP Error ${response.status}: ${response.statusText}`;
        throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }

      return data as T;
    } catch (error: any) {
      // If relative URL failed (e.g. running outside vite proxy), fallback to absolute backend URL
      if (!endpoint.startsWith('http') && this.baseUrl === '/api') {
        try {
          const fallbackUrl = `http://127.0.0.1:8000/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
          const fallbackRes = await fetch(fallbackUrl, {
            ...options,
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...sessionHeaders,
              ...(options.headers as Record<string, string> || {}),
            },
            body: options.data ? JSON.stringify(options.data) : undefined,
          });
          const text = await fallbackRes.text();
          let data: any = {};
          try {
            data = text ? JSON.parse(text) : {};
          } catch (e) {
            data = { raw: text };
          }
          if (!fallbackRes.ok) {
            throw new Error(data?.error || data?.detail || data?.message || `Error ${fallbackRes.status}`);
          }
          return data as T;
        } catch (fallbackErr: any) {
          console.error(`API Request to ${endpoint} failed:`, fallbackErr);
          throw fallbackErr;
        }
      }
      console.error(`API Request to ${endpoint} failed:`, error);
      throw error;
    }
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', data });
  }

  put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', data });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(BASE_URL);
