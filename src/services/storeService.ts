import { mockDb, SHOP_CONFIG, TIER_CONFIG, ORDER_STATUS_MAP, OPTION_PRESETS } from './mockDb';
import { apiStoreService } from './api/apiStoreService';
import type {
  AdminUserData,
  CashShift,
  Customer,
  GlobalOptionItem,
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
} from '../types';

export { SHOP_CONFIG, TIER_CONFIG, ORDER_STATUS_MAP, OPTION_PRESETS };

export type AppMode = 'demo' | 'live';

const MODE_STORAGE_KEY = 'bake_sip_app_mode';

/**
 * Tính phí giao hàng theo cấu hình tiệm
 */
export const calculateShippingFee = (
  subTotal: number,
  fulfillmentType: 'delivery' | 'pickup' = 'delivery',
  config?: ShopConfig
): number => {
  if (fulfillmentType === 'pickup') return 0;
  const delivery = config?.delivery || SHOP_CONFIG.delivery;
  if (!delivery?.enabled) return 0;
  const tiers = delivery.tiers || [];
  for (const tier of tiers) {
    if (subTotal >= tier.minOrder && (tier.maxOrder === undefined || subTotal <= tier.maxOrder)) {
      return tier.fee;
    }
  }
  return 20000;
};

/**
 * Xác định chế độ hoạt động hiện tại của ứng dụng:
 * 1. Ưu tiên URL Query Param (?mode=demo hoặc ?mode=live)
 * 2. Ưu tiên LocalStorage lưu chế độ người dùng đã chọn
 * 3. Mặc định đọc từ biến môi trường Vite: VITE_APP_MODE (mặc định 'demo' nếu chưa cấu hình)
 */
export const getAppMode = (): AppMode => {
  if (typeof window === 'undefined') return 'demo';

  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get('mode');
  if (modeParam === 'demo' || modeParam === 'live') {
    localStorage.setItem(MODE_STORAGE_KEY, modeParam);
    return modeParam;
  }

  const saved = localStorage.getItem(MODE_STORAGE_KEY) as AppMode | null;
  if (saved === 'demo' || saved === 'live') {
    return saved;
  }

  const envMode = import.meta.env.VITE_APP_MODE;
  return envMode === 'production' || envMode === 'live' ? 'live' : 'demo';
};

export const isDemoMode = (): boolean => {
  return getAppMode() === 'demo';
};

export const switchAppMode = (mode: AppMode): void => {
  localStorage.setItem(MODE_STORAGE_KEY, mode);
  const url = new URL(window.location.href);
  url.searchParams.set('mode', mode);
  window.location.href = url.toString();
};

/**
 * Service Adapter thông minh:
 * - Trong chế độ Demo: Sử dụng Mock Database (lưu trữ LocalStorage, độc lập 100%, không cần kết nối server).
 * - Trong chế độ Live: Sử dụng API Backend Golang + MongoDB + Redis thực tế.
 */
class UnifiedStoreService {
  get isDemo(): boolean {
    return isDemoMode();
  }

  // --- PRODUCTS ---
  async getProducts(onlyActive: boolean = false): Promise<Product[]> {
    if (this.isDemo) {
      const list = mockDb.getProducts();
      return onlyActive ? list.filter((p) => p.isActive) : list;
    }
    return await apiStoreService.getProducts(onlyActive);
  }

  async getProductById(id: string): Promise<Product | undefined> {
    if (this.isDemo) {
      return mockDb.getProductById(id);
    }
    return await apiStoreService.getProductById(id);
  }

  async addProduct(payload: Omit<Product, 'id' | 'updatedAt'>): Promise<Product> {
    if (this.isDemo) {
      return mockDb.addProduct(payload);
    }
    return await apiStoreService.addProduct(payload);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    if (this.isDemo) {
      return mockDb.updateProduct(id, updates);
    }
    return await apiStoreService.updateProduct(id, updates);
  }

  async toggleProductStatus(id: string): Promise<Product> {
    if (this.isDemo) {
      return mockDb.toggleProductStatus(id);
    }
    return await apiStoreService.toggleProductStatus(id);
  }

  async deleteProduct(id: string): Promise<void> {
    if (this.isDemo) {
      mockDb.deleteProduct(id);
      return;
    }
    await apiStoreService.deleteProduct(id);
  }

  async getGlobalOptionsList(): Promise<GlobalOptionItem[]> {
    if (this.isDemo) {
      return mockDb.getGlobalOptionsList();
    }
    const products = await this.getProducts();
    const map = new Map<string, GlobalOptionItem>();
    products.forEach((prod) => {
      if (prod.optionGroups) {
        prod.optionGroups.forEach((group) => {
          group.options.forEach((opt) => {
            const existing = map.get(opt.id);
            if (!existing) {
              map.set(opt.id, {
                id: opt.id,
                name: opt.name,
                price: opt.price,
                groupId: group.id,
                groupName: group.name,
                isAvailable: opt.isAvailable !== false,
                affectedProductsCount: 1,
              });
            } else {
              existing.affectedProductsCount += 1;
            }
          });
        });
      }
    });
    return Array.from(map.values());
  }

  async toggleAllProductsStatus(isActive: boolean, category?: string): Promise<Product[]> {
    if (this.isDemo) {
      return mockDb.toggleAllProductsStatus(isActive, category);
    }
    const products = await this.getProducts();
    const toUpdate = products.filter((p) => !category || category === 'Tất cả' || p.category === category);
    await Promise.all(toUpdate.map((p) => apiStoreService.updateProduct(p.id, { isActive })));
    return await this.getProducts();
  }

  async toggleOptionAvailability(optionId: string, isAvailable: boolean): Promise<void> {
    if (this.isDemo) {
      mockDb.toggleOptionAvailability(optionId, isAvailable);
      return;
    }
    const products = await this.getProducts();
    for (const prod of products) {
      let changed = false;
      if (prod.optionGroups) {
        const groups = prod.optionGroups.map((group) => ({
          ...group,
          options: group.options.map((opt) => {
            if (opt.id === optionId) {
              changed = true;
              return { ...opt, isAvailable };
            }
            return opt;
          }),
        }));
        if (changed) {
          await apiStoreService.updateProduct(prod.id, { optionGroups: groups });
        }
      }
    }
  }

  async toggleOptionGroupAvailability(groupId: string, isAvailable: boolean): Promise<void> {
    if (this.isDemo) {
      mockDb.toggleOptionGroupAvailability(groupId, isAvailable);
      return;
    }
    const products = await this.getProducts();
    for (const prod of products) {
      let changed = false;
      if (prod.optionGroups) {
        const groups = prod.optionGroups.map((group) => {
          if (group.id === groupId) {
            changed = true;
            return {
              ...group,
              options: group.options.map((opt) => ({ ...opt, isAvailable })),
            };
          }
          return group;
        });
        if (changed) {
          await apiStoreService.updateProduct(prod.id, { optionGroups: groups });
        }
      }
    }
  }

  async toggleShopOpenStatus(isOpen: boolean, pauseReason?: string): Promise<ShopConfig> {
    if (this.isDemo) {
      return mockDb.toggleShopOpenStatus(isOpen, pauseReason);
    }
    return await apiStoreService.updateShopConfig({
      isOpen,
      pauseReason: pauseReason !== undefined
        ? pauseReason
        : isOpen
        ? ''
        : 'Hôm nay tiệm tạm nghỉ nhận đơn online. Hẹn gặp lại quý khách!',
    });
  }

  // --- CONFIG ---
  async getShopConfig(): Promise<ShopConfig> {
    if (this.isDemo) {
      return mockDb.getShopConfig();
    }
    return await apiStoreService.getShopConfig();
  }

  async updateShopConfig(updates: Partial<ShopConfig>): Promise<ShopConfig> {
    if (this.isDemo) {
      return mockDb.updateShopConfig(updates);
    }
    return await apiStoreService.updateShopConfig(updates);
  }

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    if (this.isDemo) {
      return mockDb.getOrders();
    }
    return await apiStoreService.getOrders();
  }

  async getOrderByCode(code: string): Promise<Order | undefined> {
    if (this.isDemo) {
      return mockDb.getOrderByCode(code);
    }
    return await apiStoreService.getOrderByCode(code);
  }

  async getOrdersByPhone(phone: string): Promise<Order[]> {
    if (this.isDemo) {
      return mockDb.getOrdersByPhone(phone);
    }
    return await apiStoreService.getOrdersByPhone(phone);
  }

  async createPendingOrder(payload: any): Promise<{ order: Order; customer: Customer }> {
    if (this.isDemo) {
      return mockDb.createPendingOrder(payload);
    }
    return await apiStoreService.createPendingOrder(payload);
  }

  async createPosOrder(payload: any): Promise<{ order: Order; customer: Customer }> {
    if (this.isDemo) {
      return mockDb.createPosOrder(payload);
    }
    return await apiStoreService.createPosOrder(payload);
  }

  async updateOrderStatus(
    orderCode: string,
    updates: {
      status?: Order['status'];
      paymentStatus?: Order['paymentStatus'];
      shipperInfo?: string;
      discountPointsUsed?: number;
    }
  ): Promise<{ order: Order; customer: Customer }> {
    if (this.isDemo) {
      return mockDb.updateOrderStatus(orderCode, updates);
    }
    return await apiStoreService.updateOrderStatus(orderCode, updates);
  }

  // --- CUSTOMERS ---
  async findCustomerByPhone(phone: string): Promise<Customer | undefined> {
    if (this.isDemo) {
      return mockDb.findCustomerByPhone(phone);
    }
    return await apiStoreService.findCustomerByPhone(phone);
  }

  async getCustomerFullLookup(phone: string): Promise<{ customer: Customer; orders: Order[]; transactions: PointTransaction[] } | null> {
    if (this.isDemo) {
      const customer = mockDb.findCustomerByPhone(phone);
      if (!customer) return null;
      const orders = mockDb.getOrdersByPhone(phone);
      const transactions = mockDb.getTransactions(customer.id);
      return { customer, orders, transactions };
    }
    return await apiStoreService.getCustomerFullLookup(phone);
  }

  async getCustomers(): Promise<Customer[]> {
    if (this.isDemo) {
      return mockDb.getCustomers();
    }
    return await apiStoreService.getCustomers();
  }

  async getTransactions(customerId: string): Promise<PointTransaction[]> {
    if (this.isDemo) {
      return mockDb.getTransactions(customerId);
    }
    return await apiStoreService.getTransactions(customerId);
  }

  async adjustCustomerPoints(customerId: string, pointsDelta: number, note: string): Promise<Customer> {
    if (this.isDemo) {
      return mockDb.adjustCustomerPoints(customerId, pointsDelta, note);
    }
    return await apiStoreService.adjustCustomerPoints(customerId, pointsDelta, note);
  }

  // --- VOUCHERS ---
  async getVouchers(): Promise<Voucher[]> {
    if (this.isDemo) {
      return mockDb.getVouchers();
    }
    return await apiStoreService.getVouchers();
  }

  async validateAndCalculateVoucher(code: string, subTotal: number): Promise<VoucherValidationResult> {
    if (this.isDemo) {
      return mockDb.validateAndCalculateVoucher(code, subTotal);
    }
    return await apiStoreService.validateAndCalculateVoucher(code, subTotal);
  }

  async addVoucher(payload: any): Promise<Voucher> {
    if (this.isDemo) {
      return mockDb.addVoucher(payload);
    }
    return await apiStoreService.addVoucher(payload);
  }

  async updateVoucher(id: string, updates: Partial<Voucher>): Promise<Voucher> {
    if (this.isDemo) {
      return mockDb.updateVoucher(id, updates);
    }
    return await apiStoreService.updateVoucher(id, updates);
  }

  async deleteVoucher(id: string): Promise<void> {
    if (this.isDemo) {
      mockDb.deleteVoucher(id);
      return;
    }
    await apiStoreService.deleteVoucher(id);
  }

  async toggleVoucherStatus(id: string): Promise<Voucher> {
    if (this.isDemo) {
      return mockDb.toggleVoucherStatus(id);
    }
    const vouchers = await this.getVouchers();
    const target = vouchers.find((v) => v.id === id);
    if (!target) throw new Error('Voucher không tồn tại');
    return await apiStoreService.updateVoucher(id, { isActive: !target.isActive });
  }

  // --- SHIFTS ---
  async getCurrentShift(): Promise<CashShift | null> {
    if (this.isDemo) {
      return mockDb.getCurrentShift();
    }
    return await apiStoreService.getCurrentShift();
  }

  async openShift(payload: any): Promise<CashShift> {
    if (this.isDemo) {
      return mockDb.openShift(payload);
    }
    return await apiStoreService.openShift(payload);
  }

  async closeShift(id: string, actualCashOrPayload: any, notes?: string, nextStaffName?: string): Promise<CashShift> {
    const actualCash = typeof actualCashOrPayload === 'number' ? actualCashOrPayload : actualCashOrPayload?.actualCash;
    const n = typeof actualCashOrPayload === 'object' ? actualCashOrPayload?.notes : notes;
    const nextStaff = typeof actualCashOrPayload === 'object' ? actualCashOrPayload?.nextStaffName : nextStaffName;
    if (this.isDemo) {
      return mockDb.closeShift(id, { actualCash, notes: n, nextStaffName: nextStaff });
    }
    return await apiStoreService.closeShift(id, actualCash, n, nextStaff);
  }

  async getShifts(): Promise<CashShift[]> {
    if (this.isDemo) {
      return mockDb.getShifts();
    }
    return await apiStoreService.getShifts();
  }

  // --- STAFF & AUTH ---
  async authenticateStaff(username: string, pinCode: string): Promise<AdminUserData | null> {
    if (this.isDemo) {
      const staff = mockDb.authenticateStaff(username, pinCode);
      if (staff) {
        const userData: AdminUserData = {
          id: staff.id,
          username: staff.username,
          name: staff.name,
          role: staff.role,
          roleTitle: staff.role === 'owner' ? 'Chủ Tiệm (Toàn Quyền)' : 'Thu Ngân Ca Trực',
          shift: staff.shift,
        };
        sessionStorage.setItem('bake_sip_admin_user', JSON.stringify(userData));
        return userData;
      }
      return null;
    }
    return await apiStoreService.authenticateStaff(username, pinCode);
  }

  async logout(): Promise<void> {
    if (this.isDemo) {
      sessionStorage.removeItem('bake_sip_admin_user');
      return;
    }
    await apiStoreService.logout();
  }

  async getStaffAccounts(): Promise<StaffAccount[]> {
    if (this.isDemo) {
      return mockDb.getStaffAccounts();
    }
    return await apiStoreService.getStaffAccounts();
  }

  async addStaffAccount(payload: any): Promise<StaffAccount> {
    if (this.isDemo) {
      return mockDb.addStaffAccount(payload);
    }
    return await apiStoreService.addStaffAccount(payload);
  }

  async updateStaffAccount(id: string, updates: any): Promise<StaffAccount> {
    if (this.isDemo) {
      return mockDb.updateStaffAccount(id, updates);
    }
    return await apiStoreService.updateStaffAccount(id, updates);
  }

  async toggleStaffStatus(id: string): Promise<StaffAccount> {
    if (this.isDemo) {
      return mockDb.toggleStaffStatus(id);
    }
    return await apiStoreService.toggleStaffStatus(id);
  }

  // --- WORK SHIFTS ---
  async getWorkShifts(staffId?: string): Promise<WorkShift[]> {
    if (this.isDemo) {
      return mockDb.getWorkShifts(staffId);
    }
    return await apiStoreService.getWorkShifts(undefined, staffId);
  }

  async checkInWorkShift(id: string): Promise<WorkShift> {
    if (this.isDemo) {
      return mockDb.checkInWorkShift(id);
    }
    return await apiStoreService.checkInWorkShift(id);
  }

  async checkOutWorkShift(id: string, time?: string, actualNotes?: string): Promise<WorkShift> {
    if (this.isDemo) {
      return mockDb.checkOutWorkShift(id, time, actualNotes);
    }
    return await apiStoreService.confirmDailyAttendance(id, 8, 'completed', actualNotes);
  }

  async recordWorkShiftLeave(id: string, type: 'leave_excused' | 'leave_unexcused', reason: string): Promise<WorkShift> {
    if (this.isDemo) {
      return mockDb.recordWorkShiftLeave(id, type, reason);
    }
    return await apiStoreService.confirmDailyAttendance(id, 0, type, reason);
  }

  async confirmDailyAttendance(id: string, actualHours: number, status?: WorkShiftStatus, notes?: string): Promise<WorkShift> {
    if (this.isDemo) {
      return mockDb.confirmDailyAttendance(id, actualHours, status, notes);
    }
    return await apiStoreService.confirmDailyAttendance(id, actualHours, status, notes);
  }

  async saveMonthlyRoster(staffId: string, month: string, assignments: any[]): Promise<any> {
    if (this.isDemo) {
      return mockDb.saveEmployeeMonthlySchedule(staffId, month, assignments);
    }
    return await apiStoreService.saveMonthlyRoster(staffId, month, assignments);
  }

  // --- PAYROLL ---
  async getMonthlyPayrolls(month?: string): Promise<MonthlyPayrollSummary[]> {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    if (this.isDemo) {
      return mockDb.getMonthlyPayroll(targetMonth);
    }
    return await apiStoreService.getMonthlyPayrolls(targetMonth);
  }

  async adjustMonthlyPayroll(staffId: string, month: string, allowance: number, deduction: number): Promise<MonthlyPayrollSummary> {
    if (this.isDemo) {
      mockDb.savePayrollAdjustments(month, staffId, { allowance, deduction });
      const list = mockDb.getMonthlyPayroll(month);
      return list.find((p) => p.staffId === staffId) || ({} as any);
    }
    return await apiStoreService.adjustMonthlyPayroll(staffId, month, allowance, deduction);
  }

  // --- DEMO UTILITIES ---
  calculateShippingFee(subTotal: number, fulfillmentType: 'delivery' | 'pickup' = 'delivery', config?: ShopConfig): number {
    return calculateShippingFee(subTotal, fulfillmentType, config);
  }

  resetDemoData(): void {
    if (this.isDemo) {
      mockDb.resetToSeedData();
    }
  }
}

export const storeService = new UnifiedStoreService();
