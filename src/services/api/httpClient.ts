import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

// Base URL kết nối Go Backend
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Storage Keys
const ACCESS_TOKEN_KEY = 'member_shop_access_token';
const REFRESH_TOKEN_KEY = 'member_shop_refresh_token';

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Alias tương thích ngược cho codebase cũ
export const clearAccessToken = clearTokens;

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

// ---------------------------------------------------------------------------
// 1. PUBLIC AXIOS INSTANCE
// Dùng cho các API công khai: Xem thực đơn, xem thông tin quán, tra cứu đơn,
// đăng nhập (login) và làm mới token (refresh).
// Không tự động inject Authorization token để đảm bảo hiệu năng và bảo mật.
// ---------------------------------------------------------------------------
export const publicApi: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // Cho phép trình duyệt gửi/nhận HTTP-Only Cookie refresh_token
  timeout: 15000,
});

publicApi.interceptors.response.use(
  (response: AxiosResponse) => {
    // Tự động unwrap envelope `{ success: true, data: ... }` để trả về trực tiếp `data`
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.code ||
      error.message ||
      'Yêu cầu máy chủ thất bại';
    const customErr = new Error(message);
    (customErr as any).code = error.response?.data?.code || 'NETWORK_ERROR';
    (customErr as any).status = error.response?.status;
    (customErr as any).data = error.response?.data;
    return Promise.reject(customErr);
  }
);

// ---------------------------------------------------------------------------
// 2. AUTHENTICATED AXIOS INSTANCE
// Dùng cho các API yêu cầu xác thực: /admin/..., /v1/auth/me, /v1/auth/logout.
// Tự động inject Bearer Token và quản lý hàng đợi Refresh Token (Concurrency Mutex)
// Đảm bảo khi có nhiều API cùng lúc gặp lỗi 401 thì chỉ gọi 1 request refresh duy nhất!
// ---------------------------------------------------------------------------
export const authApi: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // Gửi HTTP-Only Cookie
  timeout: 20000,
});

// Request Interceptor: Luôn tự động gắn Bearer Token nếu có
authApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Trạng thái điều phối Refresh Token Concurrency (Mutex Queue)
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
  config: InternalAxiosRequestConfig;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.config.headers.Authorization = `Bearer ${token}`;
      prom.resolve(authApi(prom.config));
    }
  });
  failedQueue = [];
};

// Response Interceptor: Xử lý mượt mà lỗi 401 bằng hàng đợi Promise
authApi.interceptors.response.use(
  (response: AxiosResponse) => {
    // Unwrap envelope `{ success: true, data: ... }`
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Nếu không có config hoặc lỗi không phải 401 Unauthorized
    if (!originalRequest || error.response?.status !== 401) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.code ||
        error.message ||
        'Yêu cầu xác thực thất bại';
      const customErr = new Error(message);
      (customErr as any).code = error.response?.data?.code || 'AUTH_ERROR';
      (customErr as any).status = error.response?.status;
      (customErr as any).data = error.response?.data;
      return Promise.reject(customErr);
    }

    // Không kích hoạt refresh nếu chính request refresh hoặc login bị lỗi
    if (
      originalRequest.url?.includes('/v1/auth/login') ||
      originalRequest.url?.includes('/v1/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    // Đã thử retry lần thứ 2 rồi mà vẫn 401 -> Session hết hạn thực sự
    if (originalRequest._retry) {
      clearTokens();
      sessionStorage.removeItem('bake_sip_admin_user');
      window.dispatchEvent(new CustomEvent('shop_auth_session_expired'));
      return Promise.reject(new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
    }

    // TRƯỜNG HỢP 1: Đã có 1 request refresh đang chạy ngầm
    // => Không kích hoạt thêm request refresh nào nữa (tiết kiệm hiệu năng tối đa)
    // => Xếp request này vào hàng đợi Promise và chờ nhận token mới
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    // TRƯỜNG HỢP 2: Request đầu tiên phát hiện 401
    // => Khởi xướng tiến trình Refresh Token duy nhất
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const storedRefreshToken = getRefreshToken();

      // Gọi API refresh token (Public instance, gửi kèm HTTP-Only cookie và fallback header/body)
      const refreshPayload = storedRefreshToken ? { refreshToken: storedRefreshToken } : {};
      const refreshHeaders = storedRefreshToken ? { 'X-Refresh-Token': storedRefreshToken } : {};

      const refreshRes = await publicApi.post<{
        accessToken: string;
        refreshToken?: string;
        expiresIn?: number;
      }>('/v1/auth/refresh', refreshPayload, { headers: refreshHeaders });

      const newAccessToken =
        (refreshRes as any)?.accessToken || (refreshRes as any)?.data?.accessToken;
      const newRefreshToken =
        (refreshRes as any)?.refreshToken || (refreshRes as any)?.data?.refreshToken;

      if (!newAccessToken) {
        throw new Error('Không nhận được Access Token mới từ máy chủ');
      }

      // Lưu lại token mới
      setAccessToken(newAccessToken);
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
      }

      // Thông báo giải phóng toàn bộ hàng đợi đang chờ với token mới
      processQueue(null, newAccessToken);

      // Thử lại request gốc với token mới
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return authApi(originalRequest);
    } catch (refreshErr) {
      // Refresh thất bại -> Từ chối toàn bộ hàng đợi và xóa session
      processQueue(refreshErr, null);
      clearTokens();
      sessionStorage.removeItem('bake_sip_admin_user');
      window.dispatchEvent(new CustomEvent('shop_auth_session_expired'));
      return Promise.reject(new Error('Phiên làm việc đã kết thúc. Vui lòng đăng nhập lại.'));
    } finally {
      isRefreshing = false;
    }
  }
);

// ---------------------------------------------------------------------------
// 3. WRAPPER HTTP THÔNG MINH (TƯƠNG THÍCH NGƯỢC)
// Tự động phân luồng URL:
// - Bắt đầu bằng /admin/... hoặc /v1/auth/me, /v1/auth/logout => Sử dụng authApi
// - Các URL còn lại (/v1/products, /v1/config, /v1/orders...) => Sử dụng publicApi
// ---------------------------------------------------------------------------
const isAuthRoute = (path: string): boolean => {
  return (
    path.startsWith('/admin') ||
    path.startsWith('/v1/auth/me') ||
    path.startsWith('/v1/auth/logout')
  );
};

export const http = {
  get: <T = any>(path: string, config?: AxiosRequestConfig): Promise<T> => {
    const client = isAuthRoute(path) ? authApi : publicApi;
    return client.get(path, config) as unknown as Promise<T>;
  },
  post: <T = any>(path: string, body?: any, config?: AxiosRequestConfig): Promise<T> => {
    const client = isAuthRoute(path) ? authApi : publicApi;
    return client.post(path, body, config) as unknown as Promise<T>;
  },
  put: <T = any>(path: string, body?: any, config?: AxiosRequestConfig): Promise<T> => {
    const client = isAuthRoute(path) ? authApi : publicApi;
    return client.put(path, body, config) as unknown as Promise<T>;
  },
  patch: <T = any>(path: string, body?: any, config?: AxiosRequestConfig): Promise<T> => {
    const client = isAuthRoute(path) ? authApi : publicApi;
    return client.patch(path, body, config) as unknown as Promise<T>;
  },
  delete: <T = any>(path: string, config?: AxiosRequestConfig): Promise<T> => {
    const client = isAuthRoute(path) ? authApi : publicApi;
    return client.delete(path, config) as unknown as Promise<T>;
  },
};

// Hàm request tương thích nếu có component gọi trực tiếp
export async function request<T = any>(path: string, options: any = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const data = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined;
  const config: AxiosRequestConfig = {
    headers: options.headers,
    params: options.params,
  };

  switch (method) {
    case 'POST':
      return http.post<T>(path, data, config);
    case 'PUT':
      return http.put<T>(path, data, config);
    case 'PATCH':
      return http.patch<T>(path, data, config);
    case 'DELETE':
      return http.delete<T>(path, config);
    default:
      return http.get<T>(path, config);
  }
}
