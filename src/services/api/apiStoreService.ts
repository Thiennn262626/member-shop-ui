import {
  publicApi,
  authApi,
  setAccessToken,
  setRefreshToken,
  clearTokens,
  API_BASE,
} from './httpClient';
import type {
  CashShift,
  Customer,
  MonthlyPayrollSummary,
  Order,
  PointTransaction,
  Product,
  ShopConfig,
  StaffAccount,
  Voucher,
  VoucherValidationResult,
  WorkShift,
  WorkShiftStatus,
  AdminUserData,
} from '../../types';

class ApiStoreService {
  private sseSource: EventSource | null = null;

  constructor() {
    this.initRealtimeSSE();
  }

  // Kết nối Server-Sent Events (SSE) để nhận sự kiện realtime đơn hàng từ Golang Backend
  private initRealtimeSSE() {
    if (typeof window === 'undefined') return;

    try {
      const sseUrl = `${API_BASE}/v1/sse/events`;
      this.sseSource = new EventSource(sseUrl);

      this.sseSource.addEventListener('order_created', (e) => {
        try {
          const order: Order = JSON.parse(e.data);
          window.dispatchEvent(new CustomEvent('bake_sip_order_updated', { detail: order }));
          window.dispatchEvent(new CustomEvent('bake_sip_order_created', { detail: order }));
        } catch (err) {
          console.error('SSE order_created parse error:', err);
        }
      });

      this.sseSource.addEventListener('order_updated', (e) => {
        try {
          const order: Order = JSON.parse(e.data);
          window.dispatchEvent(new CustomEvent('bake_sip_order_updated', { detail: order }));
        } catch (err) {
          console.error('SSE order_updated parse error:', err);
        }
      });

      this.sseSource.onerror = () => {
        // SSE tự động reconnect khi mất kết nối
      };
    } catch (e) {
      console.warn('Realtime SSE could not be initialized:', e);
    }
  }

  // =========================================================================
  // 1. PUBLIC APIS (Khách hàng & Landing Page - dùng publicApi)
  // Không inject Auth Header, nhẹ nhàng, độc lập, không bị chặn bởi auth queue
  // =========================================================================

  // --- PRODUCTS (PUBLIC) ---
  async getProducts(onlyActive: boolean = false): Promise<Product[]> {
    const query = onlyActive ? '' : '?all=true';
    const list = await publicApi.get<any, Product[]>(`/v1/products${query}`);
    return list || [];
  }

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      return await publicApi.get<any, Product>(`/v1/products/${id}`);
    } catch {
      return undefined;
    }
  }

  // --- SHOP CONFIG (PUBLIC) ---
  async getShopConfig(): Promise<ShopConfig> {
    return await publicApi.get<any, ShopConfig>('/v1/config');
  }

  // --- ORDERS (PUBLIC TRACKING & CREATION) ---
  async getOrderByCode(code: string): Promise<Order | undefined> {
    try {
      const list = await publicApi.get<any, Order[]>(`/v1/orders/track?code=${encodeURIComponent(code)}`);
      return list?.[0];
    } catch {
      return undefined;
    }
  }

  async getOrdersByPhone(phone: string): Promise<Order[]> {
    try {
      const list = await publicApi.get<any, Order[]>(`/v1/orders/track?phone=${encodeURIComponent(phone)}`);
      return list || [];
    } catch {
      return [];
    }
  }

  async createPendingOrder(payload: {
    customerName: string;
    customerPhone: string;
    items: any[];
    note?: string;
    fulfillmentType: 'delivery' | 'pickup';
    deliveryAddress?: string;
    deliveryTimeType: 'asap' | 'scheduled';
    deliveryScheduledTime?: string;
    voucherCode?: string;
    discountPointsUsed?: number;
    totalPointsRedeemedItems?: number;
  }): Promise<{ order: Order; customer: Customer }> {
    return await publicApi.post<any, { order: Order; customer: Customer }>('/v1/orders', payload);
  }

  async createPosOrder(payload: any): Promise<{ order: Order; customer: Customer }> {
    return await publicApi.post<any, { order: Order; customer: Customer }>('/v1/pos/orders', payload);
  }

  // --- CUSTOMERS & LOYALTY (PUBLIC LOOKUP) ---
  async findCustomerByPhone(phone: string): Promise<Customer | undefined> {
    try {
      const res = await publicApi.get<any, { customer: Customer; orders: Order[]; transactions: PointTransaction[] }>(
        `/v1/customers/lookup?phone=${encodeURIComponent(phone)}`
      );
      return res?.customer;
    } catch {
      return undefined;
    }
  }

  async getCustomerFullLookup(phone: string): Promise<{ customer: Customer; orders: Order[]; transactions: PointTransaction[] } | null> {
    try {
      return await publicApi.get<any, { customer: Customer; orders: Order[]; transactions: PointTransaction[] }>(
        `/v1/customers/lookup?phone=${encodeURIComponent(phone)}`
      );
    } catch {
      return null;
    }
  }

  // --- VOUCHERS (PUBLIC VALIDATE) ---
  async validateAndCalculateVoucher(code: string, subTotal: number): Promise<VoucherValidationResult> {
    try {
      return await publicApi.post<any, VoucherValidationResult>('/v1/vouchers/validate', {
        code,
        subTotal,
      });
    } catch (e: any) {
      return {
        isValid: false,
        discountAmount: 0,
        message: e?.message || 'Mã giảm giá không hợp lệ',
      };
    }
  }

  // --- AUTH LOGIN (PUBLIC) ---
  async authenticateStaff(username: string, pinCode: string): Promise<AdminUserData | null> {
    try {
      const res = await publicApi.post<any, {
        accessToken: string;
        refreshToken?: string;
        expiresIn: number;
        user: {
          id: string;
          username: string;
          name: string;
          role: 'owner' | 'cashier';
          roleTitle: string;
          shift?: string;
        };
      }>('/v1/auth/login', { username, pin: pinCode });

      if (res?.accessToken) {
        setAccessToken(res.accessToken);
        if (res.refreshToken) {
          setRefreshToken(res.refreshToken);
        }
        const userData: AdminUserData = {
          id: res.user.id,
          username: res.user.username,
          name: res.user.name,
          role: res.user.role,
          roleTitle: res.user.roleTitle,
          shift: res.user.shift,
        };
        sessionStorage.setItem('bake_sip_admin_user', JSON.stringify(userData));
        return userData;
      }
      return null;
    } catch (e) {
      console.error('Login error:', e);
      return null;
    }
  }

  // =========================================================================
  // 2. AUTHENTICATED APIS (Chủ quán & Quản lý POS - dùng authApi)
  // Tự động gắn Bearer token, hỗ trợ auto-refresh token với Concurrency Mutex Queue
  // =========================================================================

  // --- AUTH ME & LOGOUT ---
  async getMe(): Promise<AdminUserData | null> {
    try {
      return await authApi.get<any, AdminUserData>('/v1/auth/me');
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await authApi.post('/v1/auth/logout');
    } catch {
      // Bỏ qua lỗi mạng khi logout
    } finally {
      clearTokens();
      sessionStorage.removeItem('bake_sip_admin_user');
    }
  }

  // --- SHOP CONFIG (ADMIN OWNER) ---
  async updateShopConfig(updates: Partial<ShopConfig>): Promise<ShopConfig> {
    return await authApi.put<any, ShopConfig>('/admin/config', updates);
  }

  // --- PRODUCTS (ADMIN) ---
  async addProduct(payload: Omit<Product, 'id' | 'updatedAt'>): Promise<Product> {
    return await authApi.post<any, Product>('/admin/products', payload);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return await authApi.put<any, Product>(`/admin/products/${id}`, updates);
  }

  async toggleProductStatus(id: string): Promise<Product> {
    return await authApi.patch<any, Product>(`/admin/products/${id}/toggle`);
  }

  async deleteProduct(id: string): Promise<void> {
    await authApi.delete(`/admin/products/${id}`);
  }

  // --- ORDERS (ADMIN) ---
  async getOrders(): Promise<Order[]> {
    const list = await authApi.get<any, Order[]>('/admin/orders?limit=100');
    return list || [];
  }

  async updateOrderStatus(
    orderCodeOrId: string,
    updates: {
      status?: Order['status'];
      paymentStatus?: Order['paymentStatus'];
      shipperInfo?: string;
      discountPointsUsed?: number;
    }
  ): Promise<{ order: Order; customer: Customer }> {
    let targetId = orderCodeOrId;
    if (orderCodeOrId.startsWith('#')) {
      const found = await this.getOrderByCode(orderCodeOrId);
      if (found) {
        targetId = found.id;
      }
    }
    return await authApi.patch<any, { order: Order; customer: Customer }>(
      `/admin/orders/${targetId}/status`,
      updates
    );
  }

  // --- CUSTOMERS (ADMIN) ---
  async getCustomers(): Promise<Customer[]> {
    const list = await authApi.get<any, Customer[]>('/admin/customers');
    return list || [];
  }

  async getTransactions(_customerId: string): Promise<PointTransaction[]> {
    return [];
  }

  async adjustCustomerPoints(customerId: string, pointsDelta: number, note: string): Promise<Customer> {
    return await authApi.post<any, Customer>(`/admin/customers/${customerId}/adjust-points`, {
      pointsDelta,
      note,
    });
  }

  // --- VOUCHERS (ADMIN) ---
  async getVouchers(): Promise<Voucher[]> {
    const list = await authApi.get<any, Voucher[]>('/admin/vouchers');
    return list || [];
  }

  async addVoucher(payload: Omit<Voucher, 'id' | 'usedCount' | 'createdAt'>): Promise<Voucher> {
    return await authApi.post<any, Voucher>('/admin/vouchers', payload);
  }

  async updateVoucher(id: string, updates: Partial<Voucher>): Promise<Voucher> {
    return await authApi.put<any, Voucher>(`/admin/vouchers/${id}`, updates);
  }

  async deleteVoucher(id: string): Promise<void> {
    await authApi.delete(`/admin/vouchers/${id}`);
  }

  // --- CASH SHIFTS (ADMIN) ---
  async getCurrentShift(): Promise<CashShift | null> {
    try {
      return await authApi.get<any, CashShift | null>('/admin/shifts/current');
    } catch {
      return null;
    }
  }

  async openShift(payload: {
    shiftName: string;
    initialFloat: number;
    notes?: string;
  }): Promise<CashShift> {
    return await authApi.post<any, CashShift>('/admin/shifts/open', payload);
  }

  async closeShift(
    id: string,
    actualCash: number,
    notes?: string,
    nextStaffName?: string
  ): Promise<CashShift> {
    return await authApi.post<any, CashShift>(`/admin/shifts/${id}/close`, {
      actualCash,
      notes,
      nextStaffName,
    });
  }

  async getShifts(): Promise<CashShift[]> {
    const list = await authApi.get<any, CashShift[]>('/admin/shifts/history');
    return list || [];
  }

  // --- STAFF ACCOUNTS (ADMIN) ---
  async getStaffAccounts(): Promise<StaffAccount[]> {
    const list = await authApi.get<any, StaffAccount[]>('/admin/staff');
    return list || [];
  }

  async addStaffAccount(payload: any): Promise<StaffAccount> {
    return await authApi.post<any, StaffAccount>('/admin/staff', payload);
  }

  async updateStaffAccount(id: string, updates: any): Promise<StaffAccount> {
    return await authApi.put<any, StaffAccount>(`/admin/staff/${id}`, updates);
  }

  async toggleStaffStatus(id: string): Promise<StaffAccount> {
    return await authApi.patch<any, StaffAccount>(`/admin/staff/${id}/toggle`);
  }

  // --- WORK SHIFTS & ROSTER (ADMIN) ---
  async getWorkShifts(month?: string, staffId?: string): Promise<WorkShift[]> {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (staffId) params.append('staffId', staffId);
    const list = await authApi.get<any, WorkShift[]>(`/admin/work-shifts?${params.toString()}`);
    return list || [];
  }

  async checkInWorkShift(id: string): Promise<WorkShift> {
    return await authApi.post<any, WorkShift>(`/admin/work-shifts/${id}/check-in`);
  }

  async confirmDailyAttendance(
    id: string,
    actualHours: number,
    status: WorkShiftStatus = 'completed',
    notes?: string
  ): Promise<WorkShift> {
    return await authApi.patch<any, WorkShift>(`/admin/work-shifts/${id}/attendance`, {
      actualHours,
      status,
      notes,
    });
  }

  async saveMonthlyRoster(staffId: string, month: string, assignments: any[]): Promise<any> {
    return await authApi.post('/admin/work-shifts/roster', {
      staffId,
      month,
      assignments,
    });
  }

  // --- PAYROLL (ADMIN) ---
  async getMonthlyPayrolls(month?: string): Promise<MonthlyPayrollSummary[]> {
    const params = month ? `?month=${encodeURIComponent(month)}` : '';
    const list = await authApi.get<any, MonthlyPayrollSummary[]>(`/admin/payroll${params}`);
    return list || [];
  }

  async adjustMonthlyPayroll(
    staffId: string,
    month: string,
    allowance: number,
    deduction: number
  ): Promise<MonthlyPayrollSummary> {
    return await authApi.post<any, MonthlyPayrollSummary>(
      `/admin/payroll/adjust/${staffId}?month=${encodeURIComponent(month)}`,
      {
        allowance,
        deduction,
      }
    );
  }
}

export const apiStoreService = new ApiStoreService();
