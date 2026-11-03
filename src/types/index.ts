// Phân hạng thành viên (Loyalty Tiers)
export type MemberTier = 'MEMBER' | 'SILVER' | 'GOLD' | 'DIAMOND';

export interface TierBenefit {
  tier: MemberTier;
  label: string;
  minSpent: number;
  pointMultiplier: number;
  perks: string[];
  badgeColor: string;
  gradientClass: string;
  cardStyle: {
    bg: string;
    border: string;
    accent: string;
    shimmer: string;
  };
}

// Cấu trúc Nhóm Tùy Chọn cho Món
export interface ItemOptionItem {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
  isAvailable?: boolean; // true = còn hàng (mặc định), false = tạm hết hàng
}

export interface ItemOptionGroup {
  id: string;
  name: string;
  required: boolean;
  selection: 'only' | 'many';
  minSelect?: number;
  maxSelect?: number;
  options: ItemOptionItem[];
}

export interface SelectedOptionChoice {
  groupId: string;
  groupName: string;
  selectedItems: ItemOptionItem[];
}

// 1. Khách hàng
export interface Customer {
  id: string;
  phone: string;
  name: string;
  tier: MemberTier;
  earnedPoints: number;
  redeemedPoints: number;
  availablePoints: number;
  totalSpent: number;
  joinedDate: string;
  createdAt: string;
  updatedAt: string;
}

// 2. Sản phẩm (Tiệm Bánh & Nước)
export interface Product {
  id: string;
  name: string;
  category: 'Bánh Mì & Mặn' | 'Bánh Ngọt & Kem' | 'Bánh Nướng Nóng' | 'Trà & Trà Sữa' | 'Cà Phê & Đá Xay';
  description: string;
  price: number;
  fakePrice?: number;
  bonusPrice?: number;
  imageUrl: string;
  isActive: boolean;
  unit: string;
  tag?: 'Bán Chạy 🔥' | 'Mới Ra Lò 🥐' | 'Signature ⭐' | 'Giảm Giá ⚡';
  rating: number;
  soldCount: number;
  optionGroups?: ItemOptionGroup[];
  updatedAt: string;
}

// 3. Món trong đơn hàng
export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  optionsSummary?: string;
  itemNote?: string;
}

// 4. Trạng thái đơn hàng & Thanh toán
export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid';

export interface OrderStatusInfo {
  status: OrderStatus;
  step: number; // 1: Đơn tạm, 2: Đang chuẩn bị, 3: Đang giao, 4: Hoàn tất
  label: string;
  badgeClass: string;
  description: string;
}

// 5. Đơn hàng đầy đủ các giai đoạn
export interface Order {
  id: string;
  orderCode: string; // VD: #BS-8924
  customerId: string;
  customerPhone: string;
  customerName: string;
  items: OrderItem[];
  subTotal: number;
  discountPointsUsed: number;
  discountAmount: number;
  
  // Giao hàng & Phí ship
  fulfillmentType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  deliveryTimeType: 'asap' | 'scheduled';
  deliveryScheduledTime?: string; // Ngày & giờ hẹn giao/nhận
  shippingFee: number;

  // Khuyến mãi / Voucher
  voucherCode?: string;
  voucherDiscount: number;

  orderTotal: number;
  earnedPoints: number;
  note?: string;
  promoCode?: string;
  
  // Trạng thái vận hành
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: 'cash' | 'vietqr';
  createdSource?: 'web' | 'pos';
  
  // Mốc thời gian các giai đoạn
  createdAt: string;
  confirmedAt?: string;
  paidAt?: string;
  shippingAt?: string;
  completedAt?: string;
  cancelledAt?: string;

  shipperInfo?: string; // Ghi chú giao hàng / tên shipper nếu có
}

// 6. Lịch sử giao dịch điểm
export interface PointTransaction {
  id: string;
  customerId: string;
  type: 'ORDER' | 'REWARD' | 'MANUAL';
  source: 'EARN' | 'REDEEM' | 'ADJUST';
  orderId?: string;
  orderCode?: string;
  points: number;
  balanceAfter: number;
  note: string;
  createdAt: string;
}

// 7. Cấu hình Cửa hàng & Vận chuyển & Tài khoản nhận tiền
export interface BankConfig {
  bankName: string; // MBBank, Vietcombank,...
  accountNumber: string;
  accountHolder: string;
}

export interface ShippingTier {
  id: string;
  minOrder: number; // Mốc giá trị đơn từ (VNĐ)
  maxOrder?: number; // Mốc giá trị đơn đến (VNĐ, undefined = không giới hạn trên)
  fee: number; // Mức phí ship tương ứng (0 = Freeship)
  label: string; // Tên hiển thị (VD: "Đơn dưới 100k", "Đơn từ 200k (Freeship)")
}

export interface DeliveryConfig {
  enabled: boolean;
  maxDistanceKm: number; // Mặc định 10km quanh khu vực
  areaNote: string; // Ghi chú phạm vi (VD: "Chỉ nhận giao hàng trong bán kính 10km quanh khu vực tiệm")
  tiers: ShippingTier[];
}

export interface ShopConfig {
  shopName: string;
  tagline: string;
  hotline: string;
  zaloPhone: string;
  address: string;
  pointToVndRatio: number;
  spendToPointRatio: number;
  bank: BankConfig;
  isOpen: boolean; // Trạng thái nhận đơn hôm nay (Mở cửa / Tạm nghỉ bán)
  pauseReason?: string; // Lý do tạm nghỉ (nếu có)
  delivery: DeliveryConfig; // Cấu hình giao hàng & phí ship đồng giá theo mốc
}

// 8. Hệ thống Mã Giảm Giá / Voucher Khuyến Mãi
export interface Voucher {
  id: string;
  code: string; // Mã voucher (VD: "BAKESIP10", "BANHNGON20K")
  title: string;
  discountType: 'percent' | 'fixed'; // Giảm % hay Giảm tiền cố định
  discountValue: number; // 10 (%) hoặc 20000 (VNĐ)
  maxDiscountAmount?: number; // Giảm tối đa bao nhiêu (nếu là percent)
  minOrderValue: number; // Đơn hàng tối thiểu để áp dụng
  startDate: string; // Ngày giờ bắt đầu (YYYY-MM-DDTHH:mm)
  endDate: string; // Ngày giờ kết thúc (YYYY-MM-DDTHH:mm)
  usageLimit?: number; // Tổng lượt dùng tối đa
  usedCount: number; // Đã dùng
  isActive: boolean;
  createdAt: string;
}

export interface VoucherValidationResult {
  isValid: boolean;
  discountAmount: number;
  message: string;
  reason?: string;
  voucher?: Voucher;
}

// 9. Quản Lý Giao Ca & Chốt Két Thu Ngân (Shift Handover & Cash Drawer)
export interface CashShift {
  id: string;
  shiftCode: string; // Mã ca (VD: #CA-2603-01)
  staffId: string;
  staffName: string;
  staffRole: AdminRole;
  shiftName: string; // Ca Sáng, Ca Chiều,...
  
  // Thời gian & Quỹ đầu ca
  openedAt: string;
  initialFloat: number; // Tiền mặt đầu ca (tiền thối / tiền lẻ)
  
  // Số liệu trong ca (tính tự động từ các đơn hoàn tất)
  cashSales: number; // Tổng tiền mặt thu
  qrSales: number; // Tổng chuyển khoản VietQR
  totalSales: number; // Tổng doanh số ca
  orderCount: number; // Tổng số đơn
  
  // Kết ca & Bàn giao
  closedAt?: string;
  expectedCash: number; // Tiền mặt dự kiến có trong két = initialFloat + cashSales
  actualCash?: number; // Tiền mặt thực tế đếm được trong két
  difference?: number; // actualCash - expectedCash (0: Khớp, >0: Thừa, <0: Thiếu)
  
  notes?: string;
  nextStaffName?: string; // Nhân viên nhận bàn giao ca
  status: 'open' | 'closed';
}

export interface GlobalOptionItem {
  id: string;
  name: string;
  price: number;
  groupId: string;
  groupName: string;
  isAvailable: boolean;
  affectedProductsCount: number;
}

// 8. Phân quyền Người Bán & Tài Khoản Thu Ngân
export type AdminRole = 'owner' | 'cashier';

export interface StaffAccount {
  id: string;
  username: string;
  name: string;
  role: AdminRole;
  phone?: string;
  shift: string;
  hourlyRate?: number; // Mức lương theo giờ (VNĐ/giờ, VD: 28000)
  isActive: boolean;
  pinCode: string;
  createdAt: string;
}

export interface AdminUserData {
  id: string;
  username: string;
  name: string;
  role: AdminRole;
  roleTitle: string;
  shift?: string;
  hourlyRate?: number;
}

// 10. Phân Ca Làm Việc Linh Hoạt & Chấm Công Tính Lương (Flexible Shift Scheduling & Timesheet)
export type WorkShiftStatus =
  | 'scheduled'     // Đã xếp ca dự kiến
  | 'in_progress'   // Đang làm việc trong ca (đã check-in)
  | 'completed'     // Đã hoàn tất ca làm việc (đã chốt số giờ thực tế)
  | 'leave_excused' // Nghỉ có phép / xin nghỉ đột xuất có lý do
  | 'leave_unexcused' // Nghỉ không phép / vắng mặt
  | 'swapped';      // Đã đổi ca cho nhân viên khác

export interface WorkShift {
  id: string;
  shiftCode: string;          // Mã ca làm (VD: #WS-0325-01)
  staffId: string;
  staffName: string;
  staffRole: AdminRole;
  date: string;               // YYYY-MM-DD
  shiftTitle: string;         // 'Ca Sáng (06:30 - 14:30)', 'Ca Chiều', 'Part-time 4h'...
  shiftType?: 'morning' | 'afternoon'; // 'morning' = Ca Sáng, 'afternoon' = Ca Chiều
  
  // Giờ dự kiến
  scheduledStartTime: string; // '06:30'
  scheduledEndTime: string;   // '14:30'
  scheduledHours: number;     // 8.0
  
  // Giờ thực tế đi làm (Chấm công thực tế)
  actualStartTime?: string;   // '06:35'
  actualEndTime?: string;     // '14:30'
  actualHours?: number;       // 8.0 (hoặc 8.5 nếu OT)
  
  status: WorkShiftStatus;
  notes?: string;             // Ghi chú phân ca hoặc phân công nhiệm vụ
  actualNotes?: string;       // Ghi chú chấm công thực tế (VD: "Xin về sớm 30p", "OT hỗ trợ làm bánh")
  createdAt: string;
  updatedAt?: string;
}

export interface MonthlyPayrollSummary {
  staffId: string;
  staffName: string;
  month: string;              // 'YYYY-MM'
  totalScheduledShifts: number;
  totalCompletedShifts: number;
  totalLeaveShifts: number;
  totalScheduledHours: number;
  totalActualHours: number;
  hourlyRate: number;         // Lương theo giờ (VD: 28.000đ/giờ)
  baseSalary: number;         // totalActualHours * hourlyRate
  allowance: number;          // Thưởng / phụ cấp chuyên cần, trách nhiệm
  deduction: number;          // Giảm trừ / phạt đi trễ
  finalSalary: number;        // baseSalary + allowance - deduction
  isFinalized: boolean;       // Đã chốt công cuối tháng hay chưa
  finalizedAt?: string;
  finalizedBy?: string;
}
