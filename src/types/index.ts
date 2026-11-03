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

// 7. Cấu hình Cửa hàng & Tài khoản nhận tiền
export interface BankConfig {
  bankName: string; // MBBank, Vietcombank,...
  accountNumber: string;
  accountHolder: string;
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
}
