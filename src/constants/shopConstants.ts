import type {
  ItemOptionGroup,
  MemberTier,
  OrderStatus,
  OrderStatusInfo,
  ShopConfig,
  TierBenefit,
} from '../types';

export const SHOP_CONFIG: ShopConfig = {
  shopName: 'Bánh Tráng Cậu Hai',
  tagline: 'Bánh Tráng Trộn & Ăn Vặt Nha Trang • Giá Học Sinh 15k - 25k',
  hotline: '0334395313',
  zaloPhone: '0334395313',
  address: '7C Đ. Tô Hiến Thành, Nha Trang, Khánh Hòa',
  pointToVndRatio: 500,    // 1 Điểm = 500 VNĐ
  spendToPointRatio: 10000, // 10.000 VNĐ = 1 Điểm
  isOpen: true,
  pauseReason: '',
  bank: {
    bankName: 'MBBank (Ngân Hàng Quân Đội)',
    accountNumber: '0334395313',
    accountHolder: 'NGUYEN DINH THIEN',
  },
  delivery: {
    enabled: true,
    maxDistanceKm: 10,
    areaNote: 'Giao nhanh quanh khu vực Nha Trang',
    tiers: [
      { id: 'tier-1', minOrder: 0, maxOrder: 49999, fee: 15000, label: 'Đơn dưới 50.000đ (Phí ship 15k)' },
      { id: 'tier-2', minOrder: 50000, maxOrder: 99999, fee: 10000, label: 'Đơn từ 50.000đ - 99.999đ (Phí ship 10k)' },
      { id: 'tier-3', minOrder: 150000, fee: 0, label: 'Đơn từ 150.000đ trở lên (Freeship 0đ)' },
    ],
  },
};

export const ORDER_STATUS_MAP: Record<OrderStatus, OrderStatusInfo> = {
  pending: {
    status: 'pending',
    step: 1,
    label: '1. Đơn tạm (Chờ tiệm nhận)',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Tiệm đã lưu đơn tạm. Hãy gửi mã đơn này qua Zalo để tiệm xác nhận món và bắt đầu trộn bánh tráng nhé!',
  },
  confirmed: {
    status: 'confirmed',
    step: 2,
    label: '2. Đang chuẩn bị món',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    description: 'Tiệm đã nhận đơn và đang trộn bánh tráng/pha chế nước uống. Bạn có thể quét mã chuyển khoản bên dưới!',
  },
  shipping: {
    status: 'shipping',
    step: 3,
    label: '3. Đang giao hàng',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    description: 'Món ăn đã đóng gói cẩn thận và đang trên đường giao đến bạn. Hãy để ý điện thoại của shipper nhé!',
  },
  completed: {
    status: 'completed',
    step: 4,
    label: '4. Đã hoàn tất & Đã tích điểm',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Đơn hàng giao thành công! Số điểm thưởng đã được cộng vào thẻ thành viên của bạn.',
  },
  cancelled: {
    status: 'cancelled',
    step: 0,
    label: 'Đã hủy đơn',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'Đơn hàng này đã được hủy theo yêu cầu.',
  },
};

export const TIER_CONFIG: Record<MemberTier, TierBenefit> = {
  MEMBER: {
    tier: 'MEMBER',
    label: 'Hội Viên Thân Thiết',
    minSpent: 0,
    pointMultiplier: 1.0,
    perks: ['Tích điểm tự động theo SĐT', 'Đổi điểm trừ tiền mặt trực tiếp', 'Nhận tin khuyến mãi mới nhất'],
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    gradientClass: 'from-stone-900 via-amber-950 to-stone-900',
    cardStyle: {
      bg: 'from-stone-800 via-amber-950 to-stone-900',
      border: 'border-amber-700/50',
      accent: 'text-amber-300',
      shimmer: 'rgba(251, 191, 36, 0.15)',
    },
  },
  SILVER: {
    tier: 'SILVER',
    label: 'Hội Viên Bạc',
    minSpent: 200000,
    pointMultiplier: 1.15,
    perks: ['Tích điểm x1.15 lần', 'Tặng 1 bịch bánh tráng tuần sinh nhật', 'Ưu tiên làm món trước'],
    badgeColor: 'bg-slate-200 text-slate-800 border-slate-400',
    gradientClass: 'from-slate-700 via-slate-800 to-slate-900',
    cardStyle: {
      bg: 'from-slate-800 via-stone-800 to-slate-950',
      border: 'border-slate-500/50',
      accent: 'text-slate-200',
      shimmer: 'rgba(226, 232, 240, 0.2)',
    },
  },
  GOLD: {
    tier: 'GOLD',
    label: 'Hội Viên Vàng',
    minSpent: 600000,
    pointMultiplier: 1.3,
    perks: ['Tích điểm x1.3 lần', 'Tặng 1 ly trà tắc khi mua từ 2 phần bánh tráng', 'Freeship đơn Zalo từ 60k'],
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-400',
    gradientClass: 'from-amber-600 via-yellow-600 to-amber-800',
    cardStyle: {
      bg: 'from-amber-600 via-yellow-700 to-amber-900',
      border: 'border-yellow-400/60',
      accent: 'text-yellow-200',
      shimmer: 'rgba(250, 204, 21, 0.3)',
    },
  },
  DIAMOND: {
    tier: 'DIAMOND',
    label: 'VIP Kim Cương',
    minSpent: 1500000,
    pointMultiplier: 1.5,
    perks: ['Tích điểm x1.5 lần siêu tốc', 'Tặng combo ăn vặt đặc biệt sinh nhật', 'Thử miễn phí món mới trước khi mở bán'],
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-400',
    gradientClass: 'from-purple-900 via-stone-900 to-indigo-950',
    cardStyle: {
      bg: 'from-indigo-950 via-purple-900 to-pink-950',
      border: 'border-purple-400/60',
      accent: 'text-pink-300',
      shimmer: 'rgba(244, 114, 182, 0.3)',
    },
  },
};

export function calculateTier(totalSpent: number): MemberTier {
  if (totalSpent >= TIER_CONFIG.DIAMOND.minSpent) return 'DIAMOND';
  if (totalSpent >= TIER_CONFIG.GOLD.minSpent) return 'GOLD';
  if (totalSpent >= TIER_CONFIG.SILVER.minSpent) return 'SILVER';
  return 'MEMBER';
}

// --- OPTION GROUPS PRESETS CHO BÁNH TRÁNG & ĂN VẶT ---
export const SPICE_LEVEL_GROUP: ItemOptionGroup = {
  id: 'spice',
  name: 'Mức Độ Cay',
  required: true,
  selection: 'only',
  options: [
    { id: 'sp-mild', name: 'Cay vừa (Tiêu chuẩn thơm ngon)', price: 0, isDefault: true },
    { id: 'sp-none', name: 'Không cay (Không bỏ ớt sa tế)', price: 0 },
    { id: 'sp-hot', name: 'Siêu cay (Hít hà tê tái)', price: 0 },
  ],
};

export const CUSTOM_NOTE_GROUP: ItemOptionGroup = {
  id: 'custom',
  name: 'Lưu Ý Khẩu Vị',
  required: false,
  selection: 'many',
  options: [
    { id: 'no-coriander', name: 'Không lấy rau răm', price: 0 },
    { id: 'no-onion', name: 'Không lấy hành phi', price: 0 },
    { id: 'sauce-separate', name: 'Để nước sốt riêng mang đi xa', price: 0 },
  ],
};

export const TOPPING_EXTRA_GROUP: ItemOptionGroup = {
  id: 'toppings',
  name: 'Topping Thêm (Ăn Cực Đã)',
  required: false,
  selection: 'many',
  options: [
    { id: 'top-quail', name: 'Thêm 3 Trứng Cút Lòng Đào', price: 5000 },
    { id: 'top-beef', name: 'Thêm Khô Bò Đen Xé Sợi', price: 5000 },
    { id: 'top-chicken', name: 'Thêm Khô Gà Lá Chanh', price: 5000 },
    { id: 'top-butter', name: 'Thêm Bịch Sốt Bơ Béo', price: 5000 },
    { id: 'top-mango', name: 'Thêm Xoài Chua Bào Sợi', price: 3000 },
    { id: 'top-shrimp', name: 'Thêm Tép Sấy Giòn Tan', price: 3000 },
  ],
};

export const DRINK_SWEET_GROUP: ItemOptionGroup = {
  id: 'drink-sweet',
  name: 'Độ Ngọt',
  required: true,
  selection: 'only',
  options: [
    { id: 'sw-100', name: '100% đường (Vừa miệng)', price: 0, isDefault: true },
    { id: 'sw-50', name: '50% đường (Ít ngọt thanh mát)', price: 0 },
  ],
};

export const DRINK_ICE_GROUP: ItemOptionGroup = {
  id: 'drink-ice',
  name: 'Lượng Đá',
  required: true,
  selection: 'only',
  options: [
    { id: 'ice-100', name: 'Đầy đá mát lạnh', price: 0, isDefault: true },
    { id: 'ice-separate', name: 'Để đá riêng đi xa', price: 0 },
  ],
};

export const OPTION_PRESETS = [
  { id: 'btt', label: '🌶️ Preset Bánh Tráng Trộn (Độ cay, Khẩu vị, Topping)', groups: [SPICE_LEVEL_GROUP, CUSTOM_NOTE_GROUP, TOPPING_EXTRA_GROUP] },
  { id: 'btc', label: '🌯 Preset Bánh Tráng Cuốn (Sốt chấm, Topping thêm)', groups: [SPICE_LEVEL_GROUP, CUSTOM_NOTE_GROUP, TOPPING_EXTRA_GROUP] },
  { id: 'btn', label: '🥐 Preset Bánh Tráng Nướng (Độ cay, Mỡ hành)', groups: [SPICE_LEVEL_GROUP] },
  { id: 'drinks', label: '🧋 Preset Đồ Uống Giải Khát (Độ ngọt, Lượng đá)', groups: [DRINK_SWEET_GROUP, DRINK_ICE_GROUP] },
];
