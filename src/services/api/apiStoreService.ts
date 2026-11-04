import { http, setAccessToken, clearAccessToken, API_BASE } from './httpClient';
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

  // --- PRODUCTS ---
  async getProducts(onlyActive: boolean = false): Promise<Product[]> {
    const query = onlyActive ? '' : '?all=true';
    const list = await http.get<Product[]>(`/v1/products${query}`);
    return list || [];
  }

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      return await http.get<Product>(`/v1/products/${id}`);
    } catch {
      return undefined;
    }
  }

  async addProduct(payload: Omit<Product, 'id' | 'updatedAt'>): Promise<Product> {
    return await http.post<Product>('/admin/products', payload);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return await http.put<Product>(`/admin/products/${id}`, updates);
  }

  async toggleProductStatus(id: string): Promise<Product> {
    return await http.patch<Product>(`/admin/products/${id}/toggle`);
  }

  async deleteProduct(id: string): Promise<void> {
    await http.delete(`/admin/products/${id}`);
  }

  // --- SHOP CONFIG ---
  async getShopConfig(): Promise<ShopConfig> {
    return await http.get<ShopConfig>('/v1/config');
  }

  async updateShopConfig(updates: Partial<ShopConfig>): Promise<ShopConfig> {
    return await http.put<ShopConfig>('/admin/config', updates);
  }

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    const list = await http.get<Order[]>('/admin/orders?limit=100');
    return list || [];
  }

  async getOrderByCode(code: string): Promise<Order | undefined> {
    try {
      const list = await http.get<Order[]>(`/v1/orders/track?code=${encodeURIComponent(code)}`);
      return list?.[0];
    } catch {
      return undefined;
    }
  }

  async getOrdersByPhone(phone: string): Promise<Order[]> {
    try {
      const list = await http.get<Order[]>(`/v1/orders/track?phone=${encodeURIComponent(phone)}`);
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
    const res = await http.post<{ order: Order; customer: Customer }>('/v1/orders', payload);
    return res;
  }

  async createPosOrder(payload: any): Promise<{ order: Order; customer: Customer }> {
    const res = await http.post<{ order: Order; customer: Customer }>('/v1/pos/orders', payload);
    return res;
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
    // Nếu orderCodeOrId là code dạng #BS-xxxx thì tìm ID trước
    let targetId = orderCodeOrId;
    if (orderCodeOrId.startsWith('#')) {
      const found = await this.getOrderByCode(orderCodeOrId);
      if (found) {
        targetId = found.id;
      }
    }
    const res = await http.patch<{ order: Order; customer: Customer }>(
      `/admin/orders/${targetId}/status`,
      updates
    );
    return res;
  }

  // --- CUSTOMERS ---
  async findCustomerByPhone(phone: string): Promise<Customer | undefined> {
    try {
      const res = await http.get<{ customer: Customer; orders: Order[]; transactions: PointTransaction[] }>(
        `/v1/customers/lookup?phone=${encodeURIComponent(phone)}`
      );
      return res?.customer;
    } catch {
      return undefined;
    }
  }

  async getCustomerFullLookup(phone: string): Promise<{ customer: Customer; orders: Order[]; transactions: PointTransaction[] } | null> {
    try {
      return await http.get<{ customer: Customer; orders: Order[]; transactions: PointTransaction[] }>(
        `/v1/customers/lookup?phone=${encodeURIComponent(phone)}`
      );
    } catch {
      return null;
    }
  }

  async getCustomers(): Promise<Customer[]> {
    const list = await http.get<Customer[]>('/admin/customers');
    return list || [];
  }

  async getTransactions(_customerId: string): Promise<PointTransaction[]> {
    return [];
  }

  async adjustCustomerPoints(customerId: string, pointsDelta: number, note: string): Promise<Customer> {
    return await http.post<Customer>(`/admin/customers/${customerId}/adjust-points`, {
      pointsDelta,
      note,
    });
  }

  // --- VOUCHERS ---
  async getVouchers(): Promise<Voucher[]> {
    const list = await http.get<Voucher[]>('/admin/vouchers');
    return list || [];
  }

  async validateAndCalculateVoucher(code: string, subTotal: number): Promise<VoucherValidationResult> {
    try {
      return await http.post<VoucherValidationResult>('/v1/vouchers/validate', {
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

  async addVoucher(payload: Omit<Voucher, 'id' | 'usedCount' | 'createdAt'>): Promise<Voucher> {
    return await http.post<Voucher>('/admin/vouchers', payload);
  }

  async updateVoucher(id: string, updates: Partial<Voucher>): Promise<Voucher> {
    return await http.put<Voucher>(`/admin/vouchers/${id}`, updates);
  }

  async deleteVoucher(id: string): Promise<void> {
    await http.delete(`/admin/vouchers/${id}`);
  }

  // --- SHIFTS ---
  async getCurrentShift(): Promise<CashShift | null> {
    try {
      return await http.get<CashShift | null>('/admin/shifts/current');
    } catch {
      return null;
    }
  }

  async openShift(payload: {
    shiftName: string;
    initialFloat: number;
    notes?: string;
  }): Promise<CashShift> {
    return await http.post<CashShift>('/admin/shifts/open', payload);
  }

  async closeShift(
    id: string,
    actualCash: number,
    notes?: string,
    nextStaffName?: string
  ): Promise<CashShift> {
    return await http.post<CashShift>(`/admin/shifts/${id}/close`, {
      actualCash,
      notes,
      nextStaffName,
    });
  }

  async getShifts(): Promise<CashShift[]> {
    const list = await http.get<CashShift[]>('/admin/shifts/history');
    return list || [];
  }

  // --- STAFF & AUTH ---
  async authenticateStaff(username: string, pinCode: string): Promise<AdminUserData | null> {
    try {
      const res = await http.post<{
        accessToken: string;
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

  async logout(): Promise<void> {
    try {
      await http.post('/v1/auth/logout');
    } catch {
      // Bỏ qua lỗi mạng khi logout
    } finally {
      clearAccessToken();
      sessionStorage.removeItem('bake_sip_admin_user');
    }
  }

  async getMe(): Promise<AdminUserData | null> {
    try {
      return await http.get<AdminUserData>('/v1/auth/me');
    } catch {
      return null;
    }
  }

  async getStaffAccounts(): Promise<StaffAccount[]> {
    const list = await http.get<StaffAccount[]>('/admin/staff');
    return list || [];
  }

  async addStaffAccount(payload: any): Promise<StaffAccount> {
    return await http.post<StaffAccount>('/admin/staff', payload);
  }

  async updateStaffAccount(id: string, updates: any): Promise<StaffAccount> {
    return await http.put<StaffAccount>(`/admin/staff/${id}`, updates);
  }

  async toggleStaffStatus(id: string): Promise<StaffAccount> {
    return await http.patch<StaffAccount>(`/admin/staff/${id}/toggle`);
  }

  // --- WORK SHIFTS ---
  async getWorkShifts(month?: string, staffId?: string): Promise<WorkShift[]> {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (staffId) params.append('staffId', staffId);
    const list = await http.get<WorkShift[]>(`/admin/work-shifts?${params.toString()}`);
    return list || [];
  }

  async checkInWorkShift(id: string): Promise<WorkShift> {
    return await http.post<WorkShift>(`/admin/work-shifts/${id}/check-in`);
  }

  async confirmDailyAttendance(
    id: string,
    actualHours: number,
    status: WorkShiftStatus = 'completed',
    notes?: string
  ): Promise<WorkShift> {
    return await http.patch<WorkShift>(`/admin/work-shifts/${id}/attendance`, {
      actualHours,
      status,
      notes,
    });
  }

  async saveMonthlyRoster(staffId: string, month: string, assignments: any[]): Promise<any> {
    return await http.post('/admin/work-shifts/roster', {
      staffId,
      month,
      assignments,
    });
  }

  // --- PAYROLL ---
  async getMonthlyPayrolls(month?: string): Promise<MonthlyPayrollSummary[]> {
    const params = month ? `?month=${encodeURIComponent(month)}` : '';
    const list = await http.get<MonthlyPayrollSummary[]>(`/admin/payroll${params}`);
    return list || [];
  }

  async adjustMonthlyPayroll(
    staffId: string,
    month: string,
    allowance: number,
    deduction: number
  ): Promise<MonthlyPayrollSummary> {
    return await http.post<MonthlyPayrollSummary>(`/admin/payroll/adjust/${staffId}?month=${encodeURIComponent(month)}`, {
      allowance,
      deduction,
    });
  }
}

export const apiStoreService = new ApiStoreService();
