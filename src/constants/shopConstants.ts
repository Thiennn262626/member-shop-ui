import type {
  ItemOptionGroup,
  MemberTier,
  OrderStatus,
  OrderStatusInfo,
  ShopConfig,
  TierBenefit,
} from '../types';

export const SHOP_CONFIG: ShopConfig = {
  shopName: 'Bake & Sip',
  tagline: 'Tiệm Bánh Nóng & Đồ Uống Tươi',
  hotline: '0901 234 567',
  zaloPhone: '0901234567',
  address: '68 Đường Hoa Sứ, Phường 7, Quận Phú Nhuận, TP.HCM',
  pointToVndRatio: 1000,   // 1 Điểm = 1.000 VNĐ
  spendToPointRatio: 10000, // 10.000 VNĐ = 1 Điểm
  isOpen: true,
  pauseReason: '',
  bank: {
    bankName: 'MBBank (Ngân Hàng Quân Đội)',
    accountNumber: '0901234567',
    accountHolder: 'TIEM BANH BAKE AND SIP',
  },
  delivery: {
    enabled: true,
    maxDistanceKm: 10,
    areaNote: 'Chỉ nhận giao hàng trong bán kính 10km quanh khu vực Phú Nhuận & lân cận',
    tiers: [
      { id: 'tier-1', minOrder: 0, maxOrder: 99999, fee: 20000, label: 'Đơn dưới 100.000đ (Phí ship 20k)' },
      { id: 'tier-2', minOrder: 100000, maxOrder: 199999, fee: 10000, label: 'Đơn từ 100.000đ - 199.999đ (Phí ship 10k)' },
      { id: 'tier-3', minOrder: 200000, fee: 0, label: 'Đơn từ 200.000đ trở lên (Freeship 0đ)' },
    ],
  },
};

export const ORDER_STATUS_MAP: Record<OrderStatus, OrderStatusInfo> = {
  pending: {
    status: 'pending',
    step: 1,
    label: '1. Đơn tạm (Chờ duyệt)',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Tiệm đã lưu đơn tạm. Hãy gửi mã đơn này qua Zalo để tiệm xác nhận món và bắt đầu làm bánh nhé!',
  },
  confirmed: {
    status: 'confirmed',
    step: 2,
    label: '2. Đang chuẩn bị bánh',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    description: 'Tiệm đã xác nhận đơn và đang chuẩn bị món. Bạn có thể quét mã chuyển tiền cho tiệm bên dưới!',
  },
  shipping: {
    status: 'shipping',
    step: 3,
    label: '3. Đang giao hàng',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    description: 'Bánh đã ra lò nóng hổi và đang trên đường giao đến bạn. Hãy để ý điện thoại của shipper nhé!',
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
    label: 'Thành Viên Mới',
    minSpent: 0,
    pointMultiplier: 1.0,
    perks: ['Tích 10k = 1 điểm', 'Đổi điểm trừ tiền trực tiếp', 'Nhận tin khuyến mãi mới nhất'],
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
    minSpent: 300000,
    pointMultiplier: 1.15,
    perks: ['Tích điểm x1.15 lần', 'Giảm 10% tuần sinh nhật', 'Được ưu tiên làm bánh mới'],
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
    minSpent: 1200000,
    pointMultiplier: 1.3,
    perks: ['Tích điểm x1.3 lần', 'Tặng 1 ly nước khi mua từ 2 bánh', 'Freeship đơn Zalo từ 100k'],
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
    minSpent: 3000000,
    pointMultiplier: 1.5,
    perks: ['Tích điểm x1.5 lần siêu tốc', 'Tặng hộp bánh sinh nhật riêng biệt', 'Thử miễn phí món mới trước khi ra mắt'],
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

export const DRINK_TEA_OPTION_GROUPS: ItemOptionGroup[] = [
  {
    id: 'size',
    name: 'Chọn Kích Thước (Size Ly)',
    required: true,
    selection: 'only',
    options: [
      { id: 'size-m', name: 'Size M (Vừa)', price: 0, isDefault: true },
      { id: 'size-l', name: 'Size L (Lớn)', price: 6000 },
    ],
  },
  {
    id: 'sugar',
    name: 'Mức Ngọt / Đường',
    required: true,
    selection: 'only',
    options: [
      { id: 'sugar-100', name: '100% đường (Tiêu chuẩn)', price: 0, isDefault: true },
      { id: 'sugar-70', name: '70% đường', price: 0 },
      { id: 'sugar-50', name: '50% đường (Ít ngọt)', price: 0 },
      { id: 'sugar-0', name: 'Không đường', price: 0 },
    ],
  },
  {
    id: 'ice',
    name: 'Lượng Đá',
    required: true,
    selection: 'only',
    options: [
      { id: 'ice-100', name: '100% đá (Tiêu chuẩn)', price: 0, isDefault: true },
      { id: 'ice-70', name: '70% đá', price: 0 },
      { id: 'ice-50', name: '50% đá (Ít đá)', price: 0 },
      { id: 'ice-separate', name: 'Để đá riêng mang đi xa', price: 0 },
      { id: 'ice-0', name: 'Không đá', price: 0 },
    ],
  },
  {
    id: 'toppings',
    name: 'Topping Thêm',
    required: false,
    selection: 'many',
    options: [
      { id: 'top-pearl', name: 'Trân Châu Hoàng Kim', price: 6000 },
      { id: 'top-cheese', name: 'Kem Phô Mai Macchiato', price: 10000 },
      { id: 'top-chestnut', name: 'Thạch Củ Năng Giòn', price: 6000 },
      { id: 'top-peach', name: 'Đào Miếng Thêm (3 lát)', price: 8000 },
    ],
  },
];

export const DRINK_COFFEE_OPTION_GROUPS: ItemOptionGroup[] = [
  {
    id: 'size',
    name: 'Kích Thước Cà Phê',
    required: true,
    selection: 'only',
    options: [
      { id: 'size-reg', name: 'Ly Tiêu Chuẩn', price: 0, isDefault: true },
      { id: 'size-large', name: 'Ly Lớn (Double Shot đậm vị)', price: 8000 },
    ],
  },
  {
    id: 'sweet',
    name: 'Độ Ngọt',
    required: true,
    selection: 'only',
    options: [
      { id: 'sw-normal', name: 'Ngọt vừa (Tiêu chuẩn)', price: 0, isDefault: true },
      { id: 'sw-less', name: 'Ít ngọt', price: 0 },
      { id: 'sw-none', name: 'Không đường', price: 0 },
    ],
  },
  {
    id: 'toppings',
    name: 'Topping Thêm',
    required: false,
    selection: 'many',
    options: [
      { id: 'top-saltcream', name: 'Thêm Lớp Kem Muối Béo', price: 8000 },
      { id: 'top-jelly', name: 'Thạch Cà Phê Đắng Nhẹ', price: 6000 },
    ],
  },
];

export const BAKERY_SAVORY_OPTION_GROUPS: ItemOptionGroup[] = [
  {
    id: 'heat',
    name: 'Yêu Cầu Độ Nóng Bánh',
    required: true,
    selection: 'only',
    options: [
      { id: 'heat-warm', name: 'Nướng nóng giòn tại lò (Khuyên dùng)', price: 0, isDefault: true },
      { id: 'heat-room', name: 'Nhiệt độ thường (Để tự hâm)', price: 0 },
    ],
  },
  {
    id: 'addons',
    name: 'Topping & Phô Mai Kèm Thêm',
    required: false,
    selection: 'many',
    options: [
      { id: 'add-cheese-sauce', name: 'Thêm Sốt Phô Mai Chảy', price: 8000 },
      { id: 'add-mozzarella', name: 'Phô Mai Mozzarella Kéo Sợi', price: 10000 },
      { id: 'add-floss', name: 'Chà Bông Gà Cay Xé Sợi', price: 6000 },
    ],
  },
];

export const BAKERY_SWEET_OPTION_GROUPS: ItemOptionGroup[] = [
  {
    id: 'heat',
    name: 'Yêu Cầu Hâm Nóng',
    required: true,
    selection: 'only',
    options: [
      { id: 'heat-bake', name: 'Nướng giòn thơm bơ tại lò', price: 0, isDefault: true },
      { id: 'heat-normal', name: 'Để nguội tự nhiên', price: 0 },
    ],
  },
  {
    id: 'sauces',
    name: 'Sốt & Topping Ngọt Thêm',
    required: false,
    selection: 'many',
    options: [
      { id: 'sc-caramel', name: 'Sốt Caramel Muối', price: 6000 },
      { id: 'sc-strawberry', name: 'Mứt Dâu Tây Pháp', price: 6000 },
      { id: 'sc-almond', name: 'Hạnh Nhân Lát Nướng Giòn', price: 6000 },
    ],
  },
];

export const CAKE_DESSERT_OPTION_GROUPS: ItemOptionGroup[] = [
  {
    id: 'box',
    name: 'Quy Cách Đóng Gói',
    required: true,
    selection: 'only',
    options: [
      { id: 'box-standard', name: 'Hộp Tiêu Chuẩn Cá Nhân', price: 0, isDefault: true },
      { id: 'box-gift', name: 'Hộp Thiếc Quà Tặng Sang Trọng', price: 15000 },
    ],
  },
  {
    id: 'accessories',
    name: 'Phụ Kiện Tiệc Kèm Thêm',
    required: false,
    selection: 'many',
    options: [
      { id: 'acc-icegel', name: 'Túi Đá Gel Giữ Lạnh (Đi xa >30p)', price: 5000 },
      { id: 'acc-candle', name: 'Bộ Nến Sinh Nhật Ánh Kim', price: 5000 },
      { id: 'acc-card', name: 'Thiệp Ghi Lời Chúc Viết Tay', price: 5000 },
    ],
  },
];

export const OPTION_PRESETS = [
  { id: 'tea', label: '🧋 Preset Trà & Nước Trái Cây (Size, Đường, Đá, Topping)', groups: DRINK_TEA_OPTION_GROUPS },
  { id: 'coffee', label: '☕ Preset Cà Phê (Size, Độ ngọt, Kem muối, Thạch)', groups: DRINK_COFFEE_OPTION_GROUPS },
  { id: 'savory', label: '🥐 Preset Bánh Mì & Mặn (Độ nóng lò, Phô mai, Chà bông)', groups: BAKERY_SAVORY_OPTION_GROUPS },
  { id: 'sweet', label: '🍰 Preset Bánh Ngọt (Hâm nóng, Sốt dâu/hạnh nhân)', groups: BAKERY_SWEET_OPTION_GROUPS },
  { id: 'cake', label: '🎂 Preset Bánh Kem & Tiệc (Hộp quà, Nến, Thiệp)', groups: CAKE_DESSERT_OPTION_GROUPS },
];
