import type {
  Customer,
  GlobalOptionItem,
  ItemOptionGroup,
  MemberTier,
  Order,
  OrderStatus,
  OrderStatusInfo,
  PaymentStatus,
  PointTransaction,
  Product,
  ShopConfig,
  StaffAccount,
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

// --- OPTION GROUPS PRESETS ---
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

const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Bánh Croissant Bơ Pháp Nướng Giòn',
    category: 'Bánh Nướng Nóng',
    description: 'Bột ngàn lớp chuẩn Pháp thơm lừng bơ Échiré, nướng vỏ giòn rụm, ruột mềm mướt thơm ngát.',
    price: 35000,
    fakePrice: 42000,
    bonusPrice: 35,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80',
    isActive: true,
    unit: 'Cái',
    tag: 'Signature ⭐',
    rating: 4.9,
    soldCount: 380,
    optionGroups: BAKERY_SWEET_OPTION_GROUPS,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    name: 'Bánh Mì Bơ Tỏi Phô Mai Chảy',
    category: 'Bánh Mì & Mặn',
    description: 'Vỏ bánh mì mềm xốp nhúng ngập sốt bơ tỏi mật ong thơm béo và kem phô mai chảy ngập tràn.',
    price: 38000,
    fakePrice: 45000,
    bonusPrice: 40,
    imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
    isActive: true,
    unit: 'Ổ',
    tag: 'Bán Chạy 🔥',
    rating: 4.8,
    soldCount: 520,
    optionGroups: BAKERY_SAVORY_OPTION_GROUPS,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    name: 'Bánh Tart Trứng Nướng Than Caramel',
    category: 'Bánh Nướng Nóng',
    description: 'Đế tart ngàn lớp giòn tan bọc lớp kem trứng béo mịn nướng xém cạnh caramel ngọt thanh quyến rũ.',
    price: 25000,
    fakePrice: 28000,
    bonusPrice: 25,
    imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=80',
    isActive: true,
    unit: 'Cái',
    tag: 'Mới Ra Lò 🥐',
    rating: 4.9,
    soldCount: 290,
    optionGroups: BAKERY_SWEET_OPTION_GROUPS,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    name: 'Bánh Tiramisu Kem Phô Mai Ý',
    category: 'Bánh Ngọt & Kem',
    description: 'Bánh ladyfinger đẫm cà phê espresso thơm nồng, quyện lớp kem mascarpone béo ngậy phủ bột cacao xịn.',
    price: 49000,
    fakePrice: 55000,
    bonusPrice: 50,
    imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=80',
    isActive: true,
    unit: 'Hộp',
    tag: 'Bán Chạy 🔥',
    rating: 5.0,
    soldCount: 410,
    optionGroups: CAKE_DESSERT_OPTION_GROUPS,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    name: 'Bánh Su Kem Vani Hokkaido',
    category: 'Bánh Ngọt & Kem',
    description: 'Vỏ choux giòn rụm bên ngoài, nhân kem sữa tươi Hokkaido mát lạnh, ngọt thanh, cắn ngập miệng.',
    price: 29000,
    fakePrice: 32000,
    bonusPrice: 30,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
    isActive: true,
    unit: 'Hộp 2 cái',
    tag: 'Mới Ra Lò 🥐',
    rating: 4.7,
    soldCount: 195,
    optionGroups: CAKE_DESSERT_OPTION_GROUPS,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    name: 'Bánh Mì Sandwich Gà Xé Phô Mai Nướng',
    category: 'Bánh Mì & Mặn',
    description: 'Bánh sandwich nướng giòn kẹp thịt gà xé đậm vị sốt Mayo cay nhẹ và phô mai mozzarella kéo sợi.',
    price: 36000,
    fakePrice: 40000,
    bonusPrice: 35,
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
    isActive: true,
    unit: 'Phần',
    tag: 'Giảm Giá ⚡',
    rating: 4.8,
    soldCount: 230,
    optionGroups: BAKERY_SAVORY_OPTION_GROUPS,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    name: 'Trà Sữa Ô Long Nướng Trân Châu Dẻo',
    category: 'Trà & Trà Sữa',
    description: 'Vị trà ô long sao cháy thơm sâu đậm hòa cùng sữa béo dịu và trân châu hoàng kim dai ngon.',
    price: 39000,
    fakePrice: 45000,
    bonusPrice: 40,
    imageUrl: 'https://images.unsplash.com/photo-1558857563-b37cf5a133df?w=500&auto=format&fit=crop&q=80',
    isActive: true,
    unit: 'Ly',
    tag: 'Bán Chạy 🔥',
    rating: 4.9,
    soldCount: 650,
    optionGroups: DRINK_TEA_OPTION_GROUPS,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-8',
    name: 'Trà Đào Cam Sả Tươi Mát Lạnh',
    category: 'Trà & Trà Sữa',
    description: 'Trà đào thanh nhẹ kết hợp cam tươi mọng nước, sả thơm thư giãn và 3 miếng đào giòn ngọt.',
    price: 35000,
    fakePrice: 40000,
    bonusPrice: 35,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=80',
    isActive: true,
    unit: 'Ly',
    tag: 'Signature ⭐',
    rating: 4.8,
    soldCount: 480,
    optionGroups: DRINK_TEA_OPTION_GROUPS,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-9',
    name: 'Cà Phê Muối Kem Béo Đậm Vị',
    category: 'Cà Phê & Đá Xay',
    description: 'Cà phê Robusta thơm đậm nguyên chất phủ lớp kem béo mặn mòi, khuấy đều uống cực cuốn.',
    price: 32000,
    fakePrice: 38000,
    bonusPrice: 30,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
    isActive: true,
    unit: 'Ly',
    tag: 'Signature ⭐',
    rating: 4.9,
    soldCount: 560,
    optionGroups: DRINK_COFFEE_OPTION_GROUPS,
    updatedAt: new Date().toISOString(),
  },
];

const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    phone: '0988111222',
    name: 'Linh Chi (Chi Chi)',
    tier: 'DIAMOND',
    earnedPoints: 480,
    redeemedPoints: 60,
    availablePoints: 420,
    totalSpent: 3450000,
    joinedDate: '15/12/2025',
    createdAt: '2025-12-15T08:30:00.000Z',
    updatedAt: '2026-03-25T14:20:00.000Z',
  },
  {
    id: 'cust-2',
    phone: '0977333444',
    name: 'Minh Quân (Quân Bùi)',
    tier: 'GOLD',
    earnedPoints: 175,
    redeemedPoints: 25,
    availablePoints: 150,
    totalSpent: 1450000,
    joinedDate: '10/01/2026',
    createdAt: '2026-01-10T09:15:00.000Z',
    updatedAt: '2026-03-20T11:45:00.000Z',
  },
  {
    id: 'cust-3',
    phone: '0912345678',
    name: 'Phương Thảo',
    tier: 'SILVER',
    earnedPoints: 60,
    redeemedPoints: 15,
    availablePoints: 45,
    totalSpent: 420000,
    joinedDate: '01/03/2026',
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-28T16:10:00.000Z',
  },
];

const SEED_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    orderCode: '#BS-8924',
    customerId: 'cust-1',
    customerPhone: '0988111222',
    customerName: 'Linh Chi (Chi Chi)',
    items: [
      {
        productId: 'prod-1',
        productName: 'Bánh Croissant Bơ Pháp Nướng Giòn',
        unitPrice: 35000,
        quantity: 2,
        totalPrice: 70000,
        optionsSummary: 'Nướng giòn thơm bơ tại lò',
        itemNote: 'Hâm thật giòn giúp em nhé',
      },
      {
        productId: 'prod-7',
        productName: 'Trà Sữa Ô Long Nướng Trân Châu Dẻo',
        unitPrice: 45000,
        quantity: 1,
        totalPrice: 45000,
        optionsSummary: 'Size L, 70% đường, Trân Châu Hoàng Kim',
        itemNote: 'Để đá riêng mang đi làm',
      },
    ],
    subTotal: 115000,
    discountPointsUsed: 0,
    discountAmount: 0,
    orderTotal: 115000,
    earnedPoints: 15,
    status: 'pending',
    paymentStatus: 'unpaid',
    note: 'Giao giờ hành chính giúp em trước 12h',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ord-1002',
    orderCode: '#BS-7712',
    customerId: 'cust-1',
    customerPhone: '0988111222',
    customerName: 'Linh Chi (Chi Chi)',
    items: [
      {
        productId: 'prod-4',
        productName: 'Bánh Tiramisu Kem Phô Mai Ý',
        unitPrice: 49000,
        quantity: 1,
        totalPrice: 49000,
        optionsSummary: 'Hộp Tiêu Chuẩn',
      },
    ],
    subTotal: 49000,
    discountPointsUsed: 0,
    discountAmount: 0,
    orderTotal: 49000,
    earnedPoints: 7,
    status: 'completed',
    paymentStatus: 'paid',
    createdAt: '2026-03-25T14:20:00.000Z',
    confirmedAt: '2026-03-25T14:22:00.000Z',
    paidAt: '2026-03-25T14:23:00.000Z',
    completedAt: '2026-03-25T14:45:00.000Z',
  },
  {
    id: 'ord-1003',
    orderCode: '#BS-6541',
    customerId: 'cust-3',
    customerPhone: '0912345678',
    customerName: 'Phương Thảo',
    items: [
      {
        productId: 'prod-2',
        productName: 'Bánh Mì Bơ Tỏi Phô Mai Chảy',
        unitPrice: 38000,
        quantity: 2,
        totalPrice: 76000,
        optionsSummary: 'Nướng nóng giòn tại lò',
      },
    ],
    subTotal: 76000,
    discountPointsUsed: 15,
    discountAmount: 15000,
    orderTotal: 61000,
    earnedPoints: 7,
    status: 'completed',
    paymentStatus: 'paid',
    createdAt: '2026-03-28T16:10:00.000Z',
    confirmedAt: '2026-03-28T16:12:00.000Z',
    paidAt: '2026-03-28T16:13:00.000Z',
    completedAt: '2026-03-28T16:35:00.000Z',
  },
];

const SEED_TRANSACTIONS: PointTransaction[] = [
  {
    id: 'tx-1',
    customerId: 'cust-1',
    type: 'ORDER',
    source: 'EARN',
    orderId: 'ord-1002',
    orderCode: '#BS-7712',
    points: 7,
    balanceAfter: 420,
    note: 'Tích điểm đơn bánh Tiramisu #BS-7712',
    createdAt: '2026-03-25T14:20:00.000Z',
  },
];

const SEED_STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 'staff-1',
    username: 'admin',
    name: 'Nguyễn Văn Minh (Chủ Tiệm)',
    role: 'owner',
    phone: '0901234567',
    shift: 'Toàn Thời Gian (Quản Trị)',
    isActive: true,
    pinCode: '123456',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'staff-2',
    username: 'thungan',
    name: 'Trần Thị Thu Ngân (Ca Sáng)',
    role: 'cashier',
    phone: '0988111222',
    shift: 'Ca Sáng (06:30 - 14:30)',
    isActive: true,
    pinCode: '123456',
    createdAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'staff-3',
    username: 'thungan2',
    name: 'Lê Hoàng Yến (Ca Chiều)',
    role: 'cashier',
    phone: '0912345678',
    shift: 'Ca Chiều (14:30 - 22:30)',
    isActive: true,
    pinCode: '123456',
    createdAt: '2026-02-01T08:00:00.000Z',
  },
];

const STORAGE_KEYS = {
  PRODUCTS: 'bake_sip_products_v5',
  CUSTOMERS: 'bake_sip_customers_v5',
  ORDERS: 'bake_sip_orders_v5',
  TRANSACTIONS: 'bake_sip_transactions_v5',
  STAFF: 'bake_sip_staff_v5',
  CONFIG: 'bake_sip_config_v5',
  REALTIME_PING: 'bake_sip_realtime_ping_v5',
};

class MockDatabase {
  private load<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private save<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // Gửi sự kiện Realtime cho toàn bộ trình duyệt & các tab khác
  private broadcastRealtimeUpdate(order: Order): void {
    try {
      // 1. Dispatch custom event trong cùng tab
      window.dispatchEvent(new CustomEvent('bake_sip_order_updated', { detail: order }));

      // 2. Trigger storage event sang các tab khác
      localStorage.setItem(
        STORAGE_KEYS.REALTIME_PING,
        JSON.stringify({
          orderId: order.id,
          orderCode: order.orderCode,
          status: order.status,
          paymentStatus: order.paymentStatus,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.error('Realtime broadcast error:', e);
    }
  }

  // --- PRODUCTS ---
  getProducts(): Product[] {
    const list = this.load<Product[]>(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.save(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
    }
    return list;
  }

  getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  }

  addProduct(payload: Omit<Product, 'id' | 'updatedAt'>): Product {
    const products = this.getProducts();
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...payload,
      id: `prod-${Date.now()}`,
      updatedAt: now,
    };
    products.unshift(newProduct);
    this.save(STORAGE_KEYS.PRODUCTS, products);
    this.broadcastProductUpdate();
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Không tìm thấy sản phẩm cần cập nhật');
    }
    const updated: Product = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    products[index] = updated;
    this.save(STORAGE_KEYS.PRODUCTS, products);
    this.broadcastProductUpdate();
    return updated;
  }

  toggleProductStatus(id: string): Product {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Không tìm thấy sản phẩm');
    }
    products[index].isActive = !products[index].isActive;
    products[index].updatedAt = new Date().toISOString();
    this.save(STORAGE_KEYS.PRODUCTS, products);
    this.broadcastProductUpdate();
    return products[index];
  }

  deleteProduct(id: string): boolean {
    const products = this.getProducts();
    const filtered = products.filter((p) => p.id !== id);
    if (filtered.length === products.length) return false;
    this.save(STORAGE_KEYS.PRODUCTS, filtered);
    this.broadcastProductUpdate();
    return true;
  }

  // Bật/tắt trạng thái kinh doanh của tất cả món (hoặc theo danh mục)
  toggleAllProductsStatus(isActive: boolean, category?: string): Product[] {
    const products = this.getProducts();
    const updated = products.map((p) => {
      if (!category || category === 'Tất cả' || p.category === category) {
        return { ...p, isActive, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    this.save(STORAGE_KEYS.PRODUCTS, updated);
    this.broadcastProductUpdate();
    return updated;
  }

  // Bật/tắt tình trạng còn hàng của một tùy chọn / topping cụ thể trên toàn bộ sản phẩm
  toggleOptionAvailability(optionId: string, isAvailable: boolean): void {
    const products = this.getProducts();
    let changed = false;

    products.forEach((prod) => {
      if (prod.optionGroups) {
        prod.optionGroups.forEach((group) => {
          group.options.forEach((opt) => {
            if (opt.id === optionId) {
              opt.isAvailable = isAvailable;
              changed = true;
            }
          });
        });
      }
    });

    if (changed) {
      this.save(STORAGE_KEYS.PRODUCTS, products);
      this.broadcastProductUpdate();
    }
  }

  // Bật/tắt toàn bộ tùy chọn trong một nhóm (VD: tắt hết toàn bộ Topping trà sữa)
  toggleOptionGroupAvailability(groupId: string, isAvailable: boolean): void {
    const products = this.getProducts();
    let changed = false;

    products.forEach((prod) => {
      if (prod.optionGroups) {
        prod.optionGroups.forEach((group) => {
          if (group.id === groupId) {
            group.options.forEach((opt) => {
              opt.isAvailable = isAvailable;
              changed = true;
            });
          }
        });
      }
    });

    if (changed) {
      this.save(STORAGE_KEYS.PRODUCTS, products);
      this.broadcastProductUpdate();
    }
  }

  // Lấy danh sách tổng hợp tất cả các Topping & Tùy Chọn đang có trên toàn bộ menu
  getGlobalOptionsList(): GlobalOptionItem[] {
    const products = this.getProducts();
    const map = new Map<string, GlobalOptionItem>();

    products.forEach((prod) => {
      if (prod.optionGroups) {
        prod.optionGroups.forEach((group) => {
          group.options.forEach((opt) => {
            if (!map.has(opt.id)) {
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
              const existing = map.get(opt.id)!;
              existing.affectedProductsCount += 1;
            }
          });
        });
      }
    });

    return Array.from(map.values());
  }

  // --- SHOP CONFIG & TRẠNG THÁI MỞ CỬA / TẠM NGHỈ ---
  getShopConfig(): ShopConfig {
    const config = this.load<ShopConfig>(STORAGE_KEYS.CONFIG, SHOP_CONFIG);
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      this.save(STORAGE_KEYS.CONFIG, SHOP_CONFIG);
    }
    Object.assign(SHOP_CONFIG, config);
    return config;
  }

  updateShopConfig(updates: Partial<ShopConfig>): ShopConfig {
    const current = this.getShopConfig();
    const updated: ShopConfig = {
      ...current,
      ...updates,
      bank: {
        ...current.bank,
        ...(updates.bank || {}),
      },
    };
    this.save(STORAGE_KEYS.CONFIG, updated);
    Object.assign(SHOP_CONFIG, updated);
    window.dispatchEvent(new CustomEvent('bake_sip_config_updated', { detail: updated }));
    return updated;
  }

  toggleShopOpenStatus(isOpen: boolean, pauseReason?: string): ShopConfig {
    return this.updateShopConfig({
      isOpen,
      pauseReason:
        pauseReason !== undefined
          ? pauseReason
          : isOpen
          ? ''
          : 'Hôm nay tiệm tạm nghỉ nhận đơn online. Hẹn gặp lại quý khách!',
    });
  }

  private broadcastProductUpdate(): void {
    try {
      window.dispatchEvent(new CustomEvent('bake_sip_product_updated'));
      localStorage.setItem(
        STORAGE_KEYS.REALTIME_PING,
        JSON.stringify({ type: 'product_update', timestamp: Date.now() })
      );
    } catch (e) {
      console.error('Product broadcast error:', e);
    }
  }

  // --- CUSTOMERS ---
  getCustomers(): Customer[] {
    const list = this.load<Customer[]>(STORAGE_KEYS.CUSTOMERS, SEED_CUSTOMERS);
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      this.save(STORAGE_KEYS.CUSTOMERS, SEED_CUSTOMERS);
    }
    return list;
  }

  findCustomerByPhone(phone: string): Customer | undefined {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    return this.getCustomers().find((c) => c.phone.replace(/\D/g, '') === cleanPhone);
  }

  createOrUpdateCustomer(name: string, phone: string): Customer {
    const customers = this.getCustomers();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const existing = customers.find((c) => c.phone.replace(/\D/g, '') === cleanPhone);

    const now = new Date().toISOString();
    if (existing) {
      if (name && existing.name !== name) {
        existing.name = name;
        existing.updatedAt = now;
        this.save(STORAGE_KEYS.CUSTOMERS, customers);
      }
      return existing;
    }

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      phone: cleanPhone,
      name: name || `Khách ${cleanPhone.slice(-4)}`,
      tier: 'MEMBER',
      earnedPoints: 0,
      redeemedPoints: 0,
      availablePoints: 0,
      totalSpent: 0,
      joinedDate: new Intl.DateTimeFormat('vi-VN').format(new Date()),
      createdAt: now,
      updatedAt: now,
    };

    customers.unshift(newCustomer);
    this.save(STORAGE_KEYS.CUSTOMERS, customers);
    return newCustomer;
  }

  // --- ORDERS ---
  getOrders(): Order[] {
    const list = this.load<Order[]>(STORAGE_KEYS.ORDERS, SEED_ORDERS);
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      this.save(STORAGE_KEYS.ORDERS, SEED_ORDERS);
    }
    return list;
  }

  getOrdersByPhone(phone: string): Order[] {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    return this.getOrders().filter((o) => o.customerPhone.replace(/\D/g, '') === cleanPhone);
  }

  getOrderByCode(code: string): Order | undefined {
    const clean = code.trim().toUpperCase().replace(/^#/, '');
    return this.getOrders().find((o) => o.orderCode.toUpperCase().replace(/^#/, '') === clean);
  }

  // 1. TẠO ĐƠN HÀNG TẠM (PENDING & UNPAID) KHI KHÁCH ĐẶT TRÊN WEB
  createPendingOrder(payload: {
    customerName: string;
    customerPhone: string;
    items: Order['items'];
    note?: string;
    promoCode?: string;
  }): { order: Order; customer: Customer } {
    const { customerName, customerPhone, items, note, promoCode } = payload;
    const now = new Date().toISOString();

    const customer = this.createOrUpdateCustomer(customerName, customerPhone);
    const subTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const tierInfo = TIER_CONFIG[customer.tier];
    const earnedPoints = Math.floor((subTotal / SHOP_CONFIG.spendToPointRatio) * tierInfo.pointMultiplier);

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `#BS-${randomDigits}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderCode,
      customerId: customer.id,
      customerPhone: customer.phone,
      customerName: customer.name,
      items,
      subTotal,
      discountPointsUsed: 0,
      discountAmount: 0,
      orderTotal: subTotal,
      earnedPoints,
      note,
      promoCode,
      status: 'pending', // Bước 1: Chờ tiệm duyệt
      paymentStatus: 'unpaid', // Khách chưa thanh toán
      createdAt: now,
    };

    const orders = this.getOrders();
    orders.unshift(newOrder);
    this.save(STORAGE_KEYS.ORDERS, orders);

    this.broadcastRealtimeUpdate(newOrder);
    return { order: newOrder, customer };
  }

  // 1.b. TẠO ĐƠN HÀNG TỪ MÀN HÌNH POS THU NGÂN (BÁN TRỰC TIẾP TẠI QUẦY / LÊN ĐƠN GIAO HÀNG)
  createPosOrder(payload: {
    customerName: string;
    customerPhone: string;
    items: Order['items'];
    note?: string;
    discountPointsUsed?: number;
    paymentMethod?: 'cash' | 'vietqr';
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    shipperInfo?: string;
  }): { order: Order; customer: Customer } {
    const {
      customerName,
      customerPhone,
      items,
      note,
      discountPointsUsed = 0,
      paymentMethod = 'cash',
      status = 'completed',
      paymentStatus = 'paid',
      shipperInfo,
    } = payload;
    const now = new Date().toISOString();

    const customer = this.createOrUpdateCustomer(customerName, customerPhone);
    const subTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const validDiscountPoints = Math.min(discountPointsUsed, customer.availablePoints);
    const discountAmount = validDiscountPoints * SHOP_CONFIG.pointToVndRatio;
    const orderTotal = Math.max(0, subTotal - discountAmount);

    const tierInfo = TIER_CONFIG[customer.tier];
    const earnedPoints = Math.floor((orderTotal / SHOP_CONFIG.spendToPointRatio) * tierInfo.pointMultiplier);

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `#POS-${randomDigits}`;

    const newOrder: Order = {
      id: `ord-pos-${Date.now()}`,
      orderCode,
      customerId: customer.id,
      customerPhone: customer.phone,
      customerName: customer.name,
      items,
      subTotal,
      discountPointsUsed: validDiscountPoints,
      discountAmount,
      orderTotal,
      earnedPoints,
      note,
      status,
      paymentStatus,
      paymentMethod,
      createdSource: 'pos',
      shipperInfo,
      createdAt: now,
      confirmedAt: status === 'confirmed' || status === 'completed' || status === 'shipping' ? now : undefined,
      paidAt: paymentStatus === 'paid' ? now : undefined,
      completedAt: status === 'completed' ? now : undefined,
    };

    // Nếu đơn hàng tạo ở trạng thái COMPLETED (Bán xong thu tiền ngay tại quầy):
    if (status === 'completed') {
      customer.totalSpent += newOrder.orderTotal;
      customer.tier = calculateTier(customer.totalSpent);
      customer.redeemedPoints += validDiscountPoints;
      customer.earnedPoints += earnedPoints;
      customer.availablePoints = customer.earnedPoints - customer.redeemedPoints;
      customer.updatedAt = now;

      const customers = this.getCustomers();
      const cIndex = customers.findIndex((c) => c.id === customer.id);
      if (cIndex >= 0) customers[cIndex] = customer;
      this.save(STORAGE_KEYS.CUSTOMERS, customers);

      // Ghi lịch sử giao dịch điểm
      const transactions = this.getTransactions();

      if (validDiscountPoints > 0) {
        transactions.unshift({
          id: `tx-${Date.now()}-redeem`,
          customerId: customer.id,
          type: 'ORDER',
          source: 'REDEEM',
          orderId: newOrder.id,
          orderCode: newOrder.orderCode,
          points: -validDiscountPoints,
          balanceAfter: customer.availablePoints - earnedPoints,
          note: `Đổi ${validDiscountPoints} điểm giảm ${discountAmount.toLocaleString('vi-VN')}đ tại POS đơn ${newOrder.orderCode}`,
          createdAt: now,
        });
      }

      if (earnedPoints > 0) {
        transactions.unshift({
          id: `tx-${Date.now()}-earn`,
          customerId: customer.id,
          type: 'ORDER',
          source: 'EARN',
          orderId: newOrder.id,
          orderCode: newOrder.orderCode,
          points: earnedPoints,
          balanceAfter: customer.availablePoints,
          note: `Tích điểm hoàn tất đơn POS ${newOrder.orderCode}`,
          createdAt: now,
        });
      }

      this.save(STORAGE_KEYS.TRANSACTIONS, transactions);
    }

    const orders = this.getOrders();
    orders.unshift(newOrder);
    this.save(STORAGE_KEYS.ORDERS, orders);

    this.broadcastRealtimeUpdate(newOrder);
    return { order: newOrder, customer };
  }

  // 2. CẬP NHẬT TRẠNG THÁI VẬN HÀNH & THANH TOÁN THEO TỪNG GIAI ĐOẠN (REALTIME)
  updateOrderStatus(
    orderCodeOrId: string,
    payload: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      shipperInfo?: string;
      discountPointsUsed?: number;
    }
  ): { order: Order; customer: Customer } {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex(
      (o) =>
        o.id === orderCodeOrId ||
        o.orderCode.toUpperCase().replace(/^#/, '') === orderCodeOrId.toUpperCase().replace(/^#/, '')
    );

    if (orderIndex === -1) {
      throw new Error('Không tìm thấy đơn hàng cần cập nhật');
    }

    const order = orders[orderIndex];
    const now = new Date().toISOString();
    const customer = this.getCustomers().find((c) => c.id === order.customerId || c.phone === order.customerPhone);

    if (!customer) {
      throw new Error('Không tìm thấy khách hàng của đơn này');
    }

    // Cập nhật thanh toán
    if (payload.paymentStatus && payload.paymentStatus !== order.paymentStatus) {
      order.paymentStatus = payload.paymentStatus;
      if (payload.paymentStatus === 'paid') {
        order.paidAt = now;
      }
    }

    // Cập nhật thông tin giao hàng
    if (payload.shipperInfo !== undefined) {
      order.shipperInfo = payload.shipperInfo;
    }

    // Cập nhật giảm giá điểm nếu có
    if (payload.discountPointsUsed !== undefined && payload.discountPointsUsed !== order.discountPointsUsed) {
      const validPoints = Math.min(payload.discountPointsUsed, customer.availablePoints);
      const discountAmount = validPoints * SHOP_CONFIG.pointToVndRatio;
      order.discountPointsUsed = validPoints;
      order.discountAmount = discountAmount;
      order.orderTotal = Math.max(0, order.subTotal - discountAmount);

      const tierInfo = TIER_CONFIG[customer.tier];
      order.earnedPoints = Math.floor((order.orderTotal / SHOP_CONFIG.spendToPointRatio) * tierInfo.pointMultiplier);
    }

    // Cập nhật trạng thái từng giai đoạn
    if (payload.status && payload.status !== order.status) {
      const prevStatus = order.status;
      order.status = payload.status;

      if (payload.status === 'confirmed') {
        order.confirmedAt = now;
      } else if (payload.status === 'shipping') {
        order.shippingAt = now;
      } else if (payload.status === 'completed') {
        order.completedAt = now;

        // Chỉ khi đơn sang trạng thái COMPLETED thì mới chính thức cộng điểm & doanh thu cho khách!
        if (prevStatus !== 'completed') {
          customer.totalSpent += order.orderTotal;
          customer.tier = calculateTier(customer.totalSpent);
          customer.redeemedPoints += order.discountPointsUsed;
          customer.earnedPoints += order.earnedPoints;
          customer.availablePoints = customer.earnedPoints - customer.redeemedPoints;
          customer.updatedAt = now;

          const customers = this.getCustomers();
          const cIndex = customers.findIndex((c) => c.id === customer.id);
          if (cIndex >= 0) customers[cIndex] = customer;
          this.save(STORAGE_KEYS.CUSTOMERS, customers);

          // Ghi lịch sử giao dịch điểm
          const transactions = this.getTransactions();

          if (order.discountPointsUsed > 0) {
            transactions.unshift({
              id: `tx-${Date.now()}-redeem`,
              customerId: customer.id,
              type: 'ORDER',
              source: 'REDEEM',
              orderId: order.id,
              orderCode: order.orderCode,
              points: -order.discountPointsUsed,
              balanceAfter: customer.availablePoints - order.earnedPoints,
              note: `Đổi ${order.discountPointsUsed} điểm giảm ${order.discountAmount.toLocaleString('vi-VN')}đ cho đơn ${order.orderCode}`,
              createdAt: now,
            });
          }

          if (order.earnedPoints > 0) {
            transactions.unshift({
              id: `tx-${Date.now()}-earn`,
              customerId: customer.id,
              type: 'ORDER',
              source: 'EARN',
              orderId: order.id,
              orderCode: order.orderCode,
              points: order.earnedPoints,
              balanceAfter: customer.availablePoints,
              note: `Tích điểm hoàn tất đơn hàng ${order.orderCode}`,
              createdAt: now,
            });
          }

          this.save(STORAGE_KEYS.TRANSACTIONS, transactions);
        }
      } else if (payload.status === 'cancelled') {
        order.cancelledAt = now;
      }
    }

    orders[orderIndex] = order;
    this.save(STORAGE_KEYS.ORDERS, orders);

    // Bắn realtime sang các màn hình đang mở
    this.broadcastRealtimeUpdate(order);

    return { order, customer };
  }

  // --- TRANSACTIONS ---
  getTransactions(customerId?: string): PointTransaction[] {
    const list = this.load<PointTransaction[]>(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      this.save(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    }
    if (customerId) {
      return list.filter((t) => t.customerId === customerId);
    }
    return list;
  }

  // Điều chỉnh điểm thưởng khách hàng thủ công (Cộng / Trừ)
  adjustCustomerPoints(customerId: string, pointsDelta: number, note: string): Customer {
    const customers = this.getCustomers();
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) {
      throw new Error('Không tìm thấy khách hàng');
    }
    const now = new Date().toISOString();
    customer.availablePoints = Math.max(0, customer.availablePoints + pointsDelta);
    if (pointsDelta > 0) {
      customer.earnedPoints += pointsDelta;
    } else {
      customer.redeemedPoints += Math.abs(pointsDelta);
    }
    customer.updatedAt = now;
    this.save(STORAGE_KEYS.CUSTOMERS, customers);

    // Ghi sổ giao dịch
    const transactions = this.getTransactions();
    transactions.unshift({
      id: `tx-adjust-${Date.now()}`,
      customerId: customer.id,
      type: 'MANUAL',
      source: 'ADJUST',
      points: pointsDelta,
      balanceAfter: customer.availablePoints,
      note: note || (pointsDelta > 0 ? 'Thưởng điểm chăm sóc khách hàng' : 'Trừ điểm điều chỉnh'),
      createdAt: now,
    });
    this.save(STORAGE_KEYS.TRANSACTIONS, transactions);

    window.dispatchEvent(new CustomEvent('bake_sip_customer_updated', { detail: customer }));
    return customer;
  }

  // --- STAFF ACCOUNTS MANAGEMENT (QUẢN LÝ TÀI KHOẢN THU NGÂN) ---
  getStaffAccounts(): StaffAccount[] {
    const list = this.load<StaffAccount[]>(STORAGE_KEYS.STAFF, SEED_STAFF_ACCOUNTS);
    if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
      this.save(STORAGE_KEYS.STAFF, SEED_STAFF_ACCOUNTS);
    }
    return list;
  }

  addStaffAccount(payload: Omit<StaffAccount, 'id' | 'createdAt'>): StaffAccount {
    const staffList = this.getStaffAccounts();
    const existing = staffList.find((s) => s.username.toLowerCase() === payload.username.toLowerCase());
    if (existing) {
      throw new Error(`Tên đăng nhập "${payload.username}" đã tồn tại trên hệ thống.`);
    }

    const newStaff: StaffAccount = {
      ...payload,
      id: `staff-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    staffList.push(newStaff);
    this.save(STORAGE_KEYS.STAFF, staffList);
    window.dispatchEvent(new CustomEvent('bake_sip_staff_updated'));
    return newStaff;
  }

  updateStaffAccount(id: string, updates: Partial<StaffAccount>): StaffAccount {
    const staffList = this.getStaffAccounts();
    const index = staffList.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('Không tìm thấy tài khoản nhân viên cần sửa.');
    }

    if (updates.username) {
      const duplicate = staffList.find(
        (s) => s.id !== id && s.username.toLowerCase() === updates.username!.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Tên đăng nhập "${updates.username}" đã bị trùng.`);
      }
    }

    staffList[index] = { ...staffList[index], ...updates };
    this.save(STORAGE_KEYS.STAFF, staffList);
    window.dispatchEvent(new CustomEvent('bake_sip_staff_updated'));
    return staffList[index];
  }

  toggleStaffStatus(id: string): StaffAccount {
    const staffList = this.getStaffAccounts();
    const index = staffList.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Không tìm thấy tài khoản');
    if (staffList[index].username === 'admin') {
      throw new Error('Không thể khóa tài khoản Chủ Tiệm (Admin chính).');
    }
    staffList[index].isActive = !staffList[index].isActive;
    this.save(STORAGE_KEYS.STAFF, staffList);
    window.dispatchEvent(new CustomEvent('bake_sip_staff_updated'));
    return staffList[index];
  }

  deleteStaffAccount(id: string): boolean {
    const staffList = this.getStaffAccounts();
    const target = staffList.find((s) => s.id === id);
    if (!target) return false;
    if (target.username === 'admin') {
      throw new Error('Không thể xóa tài khoản Chủ Tiệm (Admin chính).');
    }
    const filtered = staffList.filter((s) => s.id !== id);
    this.save(STORAGE_KEYS.STAFF, filtered);
    window.dispatchEvent(new CustomEvent('bake_sip_staff_updated'));
    return true;
  }

  authenticateStaff(username: string, pinCode: string): StaffAccount | null {
    const staffList = this.getStaffAccounts();
    const cleanUser = username.trim().toLowerCase();
    const found = staffList.find(
      (s) => s.username.toLowerCase() === cleanUser && s.pinCode === pinCode.trim()
    );
    if (!found) return null;
    if (!found.isActive) {
      throw new Error('Tài khoản này hiện đang bị tạm khóa. Vui lòng liên hệ Chủ tiệm!');
    }
    return found;
  }
}

export const mockDb = new MockDatabase();
