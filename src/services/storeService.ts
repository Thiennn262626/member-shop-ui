import { apiStoreService } from './api/apiStoreService';
import {
  SHOP_CONFIG,
  TIER_CONFIG,
  ORDER_STATUS_MAP,
  OPTION_PRESETS,
  calculateTier,
  SPICE_LEVEL_GROUP,
  CUSTOM_NOTE_GROUP,
  TOPPING_EXTRA_GROUP,
  DRINK_SWEET_GROUP,
  DRINK_ICE_GROUP,
} from '../constants/shopConstants';
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

export {
  SHOP_CONFIG,
  TIER_CONFIG,
  ORDER_STATUS_MAP,
  OPTION_PRESETS,
  calculateTier,
  SPICE_LEVEL_GROUP,
  CUSTOM_NOTE_GROUP,
  TOPPING_EXTRA_GROUP,
  DRINK_SWEET_GROUP,
  DRINK_ICE_GROUP,
};

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
 * Service chính kết nối toàn diện với Go Backend API, MongoDB Atlas và Redis Cloud
 */
class StoreService {
  // --- PRODUCTS ---
  async getProducts(onlyActive: boolean = false): Promise<Product[]> {
    return await apiStoreService.getProducts(onlyActive);
  }

  async getProductById(id: string): Promise<Product | undefined> {
    return await apiStoreService.getProductById(id);
  }

  async addProduct(payload: Omit<Product, 'id' | 'updatedAt'>): Promise<Product> {
    return await apiStoreService.addProduct(payload);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return await apiStoreService.updateProduct(id, updates);
  }

  async toggleProductStatus(id: string): Promise<Product> {
    return await apiStoreService.toggleProductStatus(id);
  }

  async deleteProduct(id: string): Promise<void> {
    await apiStoreService.deleteProduct(id);
  }

  async getGlobalOptionsList(): Promise<GlobalOptionItem[]> {
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
    const products = await this.getProducts();
    const toUpdate = products.filter((p) => !category || category === 'Tất cả' || p.category === category);
    await Promise.all(toUpdate.map((p) => apiStoreService.updateProduct(p.id, { isActive })));
    return await this.getProducts();
  }

  async toggleOptionAvailability(optionId: string, isAvailable: boolean): Promise<void> {
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
    return await apiStoreService.getShopConfig();
  }

  async updateShopConfig(updates: Partial<ShopConfig>): Promise<ShopConfig> {
    return await apiStoreService.updateShopConfig(updates);
  }

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    return await apiStoreService.getOrders();
  }

  async getOrderByCode(code: string): Promise<Order | undefined> {
    return await apiStoreService.getOrderByCode(code);
  }

  async getOrdersByPhone(phone: string): Promise<Order[]> {
    return await apiStoreService.getOrdersByPhone(phone);
  }

  async createPendingOrder(payload: any): Promise<{ order: Order; customer: Customer }> {
    return await apiStoreService.createPendingOrder(payload);
  }

  async createPosOrder(payload: any): Promise<{ order: Order; customer: Customer }> {
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
    return await apiStoreService.updateOrderStatus(orderCode, updates);
  }

  // --- CUSTOMERS ---
  async findCustomerByPhone(phone: string): Promise<Customer | undefined> {
    return await apiStoreService.findCustomerByPhone(phone);
  }

  async getCustomerFullLookup(phone: string): Promise<{ customer: Customer; orders: Order[]; transactions: PointTransaction[] } | null> {
    return await apiStoreService.getCustomerFullLookup(phone);
  }

  async getCustomers(): Promise<Customer[]> {
    return await apiStoreService.getCustomers();
  }

  async getTransactions(customerId: string): Promise<PointTransaction[]> {
    return await apiStoreService.getTransactions(customerId);
  }

  async adjustCustomerPoints(customerId: string, pointsDelta: number, note: string): Promise<Customer> {
    return await apiStoreService.adjustCustomerPoints(customerId, pointsDelta, note);
  }

  // --- VOUCHERS ---
  async getVouchers(): Promise<Voucher[]> {
    return await apiStoreService.getVouchers();
  }

  async validateAndCalculateVoucher(code: string, subTotal: number): Promise<VoucherValidationResult> {
    return await apiStoreService.validateAndCalculateVoucher(code, subTotal);
  }

  async addVoucher(payload: any): Promise<Voucher> {
    return await apiStoreService.addVoucher(payload);
  }

  async updateVoucher(id: string, updates: Partial<Voucher>): Promise<Voucher> {
    return await apiStoreService.updateVoucher(id, updates);
  }

  async deleteVoucher(id: string): Promise<void> {
    await apiStoreService.deleteVoucher(id);
  }

  async toggleVoucherStatus(id: string): Promise<Voucher> {
    const vouchers = await this.getVouchers();
    const target = vouchers.find((v) => v.id === id);
    if (!target) throw new Error('Voucher không tồn tại');
    return await apiStoreService.updateVoucher(id, { isActive: !target.isActive });
  }

  // --- SHIFTS ---
  async getCurrentShift(): Promise<CashShift | null> {
    return await apiStoreService.getCurrentShift();
  }

  async openShift(payload: any): Promise<CashShift> {
    return await apiStoreService.openShift(payload);
  }

  async closeShift(id: string, actualCashOrPayload: any, notes?: string, nextStaffName?: string): Promise<CashShift> {
    const actualCash = typeof actualCashOrPayload === 'number' ? actualCashOrPayload : actualCashOrPayload?.actualCash;
    const n = typeof actualCashOrPayload === 'object' ? actualCashOrPayload?.notes : notes;
    const nextStaff = typeof actualCashOrPayload === 'object' ? actualCashOrPayload?.nextStaffName : nextStaffName;
    return await apiStoreService.closeShift(id, actualCash, n, nextStaff);
  }

  async getShifts(): Promise<CashShift[]> {
    return await apiStoreService.getShifts();
  }

  // --- STAFF & AUTH ---
  async authenticateStaff(username: string, pinCode: string): Promise<AdminUserData | null> {
    return await apiStoreService.authenticateStaff(username, pinCode);
  }

  async logout(): Promise<void> {
    await apiStoreService.logout();
  }

  async getStaffAccounts(): Promise<StaffAccount[]> {
    return await apiStoreService.getStaffAccounts();
  }

  async addStaffAccount(payload: any): Promise<StaffAccount> {
    return await apiStoreService.addStaffAccount(payload);
  }

  async updateStaffAccount(id: string, updates: any): Promise<StaffAccount> {
    return await apiStoreService.updateStaffAccount(id, updates);
  }

  async toggleStaffStatus(id: string): Promise<StaffAccount> {
    return await apiStoreService.toggleStaffStatus(id);
  }

  // --- WORK SHIFTS ---
  async getWorkShifts(staffId?: string): Promise<WorkShift[]> {
    return await apiStoreService.getWorkShifts(undefined, staffId);
  }

  async checkInWorkShift(id: string): Promise<WorkShift> {
    return await apiStoreService.checkInWorkShift(id);
  }

  async checkOutWorkShift(id: string, _time?: string, actualNotes?: string): Promise<WorkShift> {
    return await apiStoreService.confirmDailyAttendance(id, 8, 'completed', actualNotes);
  }

  async recordWorkShiftLeave(id: string, type: 'leave_excused' | 'leave_unexcused', reason: string): Promise<WorkShift> {
    return await apiStoreService.confirmDailyAttendance(id, 0, type, reason);
  }

  async confirmDailyAttendance(id: string, actualHours: number, status?: WorkShiftStatus, notes?: string): Promise<WorkShift> {
    return await apiStoreService.confirmDailyAttendance(id, actualHours, status, notes);
  }

  async saveMonthlyRoster(staffId: string, month: string, assignments: any[]): Promise<any> {
    return await apiStoreService.saveMonthlyRoster(staffId, month, assignments);
  }

  // --- PAYROLL ---
  async getMonthlyPayrolls(month?: string): Promise<MonthlyPayrollSummary[]> {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    return await apiStoreService.getMonthlyPayrolls(targetMonth);
  }

  async adjustMonthlyPayroll(staffId: string, month: string, allowance: number, deduction: number): Promise<MonthlyPayrollSummary> {
    return await apiStoreService.adjustMonthlyPayroll(staffId, month, allowance, deduction);
  }

  calculateShippingFee(subTotal: number, fulfillmentType: 'delivery' | 'pickup' = 'delivery', config?: ShopConfig): number {
    return calculateShippingFee(subTotal, fulfillmentType, config);
  }
}

export const storeService = new StoreService();
