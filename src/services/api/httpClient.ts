// HTTP Client chuyên dụng kết nối Go Backend với cơ chế Auto-Refresh Token và HttpOnly Cookie

export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const TOKEN_KEY = 'member_shop_access_token';

export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAccessToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearAccessToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export interface ApiResponse<T = any> {
  success: boolean;
  code: string;
  message: string;
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  traceId?: string;
  timestamp?: string;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

export async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getAccessToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Bắt buộc để trình duyệt tự gửi HTTP-Only Cookie refresh_token
  };

  try {
    let response = await fetch(url, fetchOptions);

    // Xử lý tự động Refresh Token khi gặp lỗi 401 Unauthorized
    if (response.status === 401 && !path.includes('/auth/refresh') && !path.includes('/auth/login')) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshRes = await fetch(`${API_BASE}/v1/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { Accept: 'application/json' },
          });

          if (refreshRes.ok) {
            const refreshData: ApiResponse<{ accessToken: string }> = await refreshRes.json();
            const newToken = refreshData.data?.accessToken;
            if (newToken) {
              setAccessToken(newToken);
              onTokenRefreshed(newToken);
              isRefreshing = false;

              // Thử lại request gốc với token mới
              headers['Authorization'] = `Bearer ${newToken}`;
              response = await fetch(url, { ...fetchOptions, headers });
            } else {
              throw new Error('Không nhận được Access Token mới');
            }
          } else {
            clearAccessToken();
            sessionStorage.removeItem('bake_sip_admin_user');
            isRefreshing = false;
          }
        } catch (e) {
          clearAccessToken();
          sessionStorage.removeItem('bake_sip_admin_user');
          isRefreshing = false;
        }
      } else {
        // Đang có tiến trình refresh token chạy ngầm, chờ nhận token mới rồi retry
        const retryToken = await new Promise<string>((resolve) => {
          addRefreshSubscriber(resolve);
        });
        headers['Authorization'] = `Bearer ${retryToken}`;
        response = await fetch(url, { ...fetchOptions, headers });
      }
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      return null as any;
    }

    const json: ApiResponse<T> = await response.json();

    if (!response.ok || json.success === false) {
      throw new Error(json.message || `Yêu cầu thất bại (${json.code || response.status})`);
    }

    return json.data;
  } catch (error: any) {
    console.error(`API Call failed [${options.method || 'GET'} ${path}]:`, error);
    throw error;
  }
}

export const http = {
  get: <T = any>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T = any>(path: string, body?: any, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T = any>(path: string, body?: any, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T = any>(path: string, body?: any, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T = any>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
