import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Sparkles,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Truck,
  RotateCcw,
  ChefHat,
  MessageSquare,
  Award,
  X,
  Copy,
  Check,
  PackageX,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { mockDb, SHOP_CONFIG, TIER_CONFIG } from '../../services/mockDb';
import type { Customer, OrderItem, Product, SelectedOptionChoice } from '../../types';
import { formatCurrency } from '../../utils/format';
import { ItemCustomizationModal } from '../landing/ItemCustomizationModal';

interface PosOrderCreatorProps {
  onOrderCreated: (orderId: string) => void;
  onSwitchToOrdersList: () => void;
  onSwitchToStockManager?: () => void;
}

export const PosOrderCreator: React.FC<PosOrderCreatorProps> = ({
  onOrderCreated,
  onSwitchToOrdersList,
  onSwitchToStockManager,
}) => {
  // Products & Categories
  const [products, setProducts] = useState<Product[]>(() => mockDb.getProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => mockDb.getCustomers());
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [productSearch, setProductSearch] = useState<string>('');

  // Lắng nghe cập nhật sản phẩm & khách hàng Realtime
  useEffect(() => {
    const handleProductChange = () => {
      setProducts(mockDb.getProducts());
    };
    const handleCustomerChange = () => {
      setCustomers(mockDb.getCustomers());
    };
    window.addEventListener('bake_sip_product_updated', handleProductChange);
    window.addEventListener('bake_sip_order_updated', handleCustomerChange);
    return () => {
      window.removeEventListener('bake_sip_product_updated', handleProductChange);
      window.removeEventListener('bake_sip_order_updated', handleCustomerChange);
    };
  }, []);

  // Cart / Bill State
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [itemToCustomize, setItemToCustomize] = useState<Product | null>(null);

  // Customer Information
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);

  // Financials & Loyalty Redemption
  const [discountPointsUsed, setDiscountPointsUsed] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'vietqr'>('cash');
  const [cashGiven, setCashGiven] = useState<number | ''>('');
  const [orderNote, setOrderNote] = useState<string>('');
  const [shipperNote, setShipperNote] = useState<string>('');

  // Modals & Feedback
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [createdSuccessOrder, setCreatedSuccessOrder] = useState<{
    orderCode: string;
    customerName: string;
    orderTotal: number;
    earnedPoints: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Lọc sản phẩm theo danh mục và từ khóa
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['Tất cả', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Tất cả' || p.category === selectedCategory;
      const matchQuery =
        !productSearch.trim() ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(productSearch.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, productSearch]);

  // Xử lý tra cứu khách hàng theo SĐT
  const handlePhoneChange = (input: string) => {
    setCustomerPhone(input);
    const clean = input.trim().replace(/\D/g, '');
    if (clean.length >= 9) {
      const found = mockDb.findCustomerByPhone(clean);
      if (found) {
        setMatchedCustomer(found);
        setCustomerName(found.name);
      } else {
        setMatchedCustomer(null);
      }
    } else {
      setMatchedCustomer(null);
    }
  };

  const handleSelectSuggestedCustomer = (c: Customer) => {
    setCustomerPhone(c.phone);
    setCustomerName(c.name);
    setMatchedCustomer(c);
  };

  // Thêm món vào hóa đơn
  const handleProductClick = (product: Product) => {
    if (!product.isActive) return;
    if (product.optionGroups && product.optionGroups.length > 0) {
      setItemToCustomize(product);
    } else {
      // Món không có options -> thêm trực tiếp
      addItemToCart({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: 1,
        totalPrice: product.price,
      });
    }
  };

  const handleConfirmCustomization = (payload: {
    product: Product;
    quantity: number;
    selectedOptions: SelectedOptionChoice[];
    itemNote?: string;
  }) => {
    let optionsExtraPrice = 0;
    const summaryParts: string[] = [];

    payload.selectedOptions.forEach((group) => {
      group.selectedItems.forEach((item) => {
        optionsExtraPrice += item.price;
        summaryParts.push(item.name);
      });
    });

    const unitPrice = payload.product.price + optionsExtraPrice;
    const totalPrice = unitPrice * payload.quantity;

    addItemToCart({
      productId: payload.product.id,
      productName: payload.product.name,
      unitPrice,
      quantity: payload.quantity,
      totalPrice,
      optionsSummary: summaryParts.join(' • '),
      itemNote: payload.itemNote,
    });

    setItemToCustomize(null);
  };

  const addItemToCart = (newItem: OrderItem) => {
    setCartItems((prev) => {
      // Kiểm tra món đã có trong giỏ với options y hệt chưa
      const existingIdx = prev.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          (item.optionsSummary || '') === (newItem.optionsSummary || '') &&
          (item.itemNote || '') === (newItem.itemNote || '')
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        const current = updated[existingIdx];
        const newQty = current.quantity + newItem.quantity;
        updated[existingIdx] = {
          ...current,
          quantity: newQty,
          totalPrice: current.unitPrice * newQty,
        };
        return updated;
      }
      return [newItem, ...prev];
    });
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    setCartItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const newQty = item.quantity + delta;

      if (newQty <= 0) {
        return updated.filter((_, idx) => idx !== index);
      }
      updated[index] = {
        ...item,
        quantity: newQty,
        totalPrice: item.unitPrice * newQty,
      };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    if (window.confirm('Bạn có chắc muốn làm trống hóa đơn này?')) {
      setCartItems([]);
      setDiscountPointsUsed(0);
      setCashGiven('');
      setErrorMsg(null);
    }
  };

  // Tính toán tiền & Điểm
  const subTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cartItems]);

  const maxRedeemablePoints = matchedCustomer ? matchedCustomer.availablePoints : 0;
  const validDiscountPoints = Math.min(discountPointsUsed, maxRedeemablePoints);
  const discountAmount = validDiscountPoints * SHOP_CONFIG.pointToVndRatio;
  const orderTotal = Math.max(0, subTotal - discountAmount);

  // Điểm thưởng dự kiến cộng cho đơn
  const customerTier = matchedCustomer ? matchedCustomer.tier : 'MEMBER';
  const tierInfo = TIER_CONFIG[customerTier];
  const expectedPoints = Math.floor((orderTotal / SHOP_CONFIG.spendToPointRatio) * tierInfo.pointMultiplier);

  // Tiền thối lại cho khách nếu thanh toán tiền mặt
  const changeMoney = typeof cashGiven === 'number' && cashGiven >= orderTotal ? cashGiven - orderTotal : 0;

  // Thực hiện tạo đơn hàng
  const handleProcessOrder = (isDelivery: boolean = false) => {
    setErrorMsg(null);

    if (cartItems.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 món bánh hoặc nước vào hóa đơn.');
      return;
    }

    const cleanPhone = customerPhone.trim().replace(/\D/g, '');
    if (!cleanPhone) {
      setErrorMsg('Vui lòng nhập Số Điện Thoại của khách để tích điểm.');
      return;
    }

    try {
      const finalName = customerName.trim() || `Khách ${cleanPhone.slice(-4)}`;

      // Quyết định trạng thái đơn
      // Nếu là bán tại quầy: status = completed, paymentStatus = paid
      // Nếu là đơn giao hàng: status = confirmed, paymentStatus = paymentMethod === 'cash' ? 'unpaid' : 'paid'
      const status = isDelivery ? 'confirmed' : 'completed';
      const paymentStatus = isDelivery && paymentMethod === 'cash' ? 'unpaid' : 'paid';

      const { order, customer } = mockDb.createPosOrder({
        customerName: finalName,
        customerPhone: cleanPhone,
        items: cartItems,
        note: orderNote.trim() || undefined,
        discountPointsUsed: validDiscountPoints,
        paymentMethod,
        status,
        paymentStatus,
        shipperInfo: isDelivery ? shipperNote.trim() || 'Tiệm đang chuẩn bị giao' : undefined,
      });

      // Pháo hoa nhẹ
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });

      setCreatedSuccessOrder({
        orderCode: order.orderCode,
        customerName: customer.name,
        orderTotal: order.orderTotal,
        earnedPoints: order.earnedPoints,
      });

      // Reset form
      setCartItems([]);
      setDiscountPointsUsed(0);
      setCashGiven('');
      setOrderNote('');
      setShipperNote('');

      // Thông báo lên parent
      onOrderCreated(order.id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Lỗi khi tạo đơn hàng';
      setErrorMsg(msg);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-5 p-3 sm:p-5 max-w-[1600px] mx-auto w-full">
      {/* CỘT TRÁI: MENU SẢN PHẨM & TÌM KIẾM (60-65% width) */}
      <div className="lg:w-7/12 flex flex-col gap-4">
        {/* Thanh tìm kiếm & Tabs danh mục */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif font-extrabold text-stone-900 text-lg sm:text-xl flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-amber-600" />
                <span>Thực Đơn Tiệm Bánh & Nước</span>
              </h2>
              <span className="text-xs text-stone-500">
                Bấm vào món để thêm nhanh vào hóa đơn hoặc tùy chỉnh Size & Topping
              </span>
            </div>

            {/* Ô tìm kiếm món & Nút chuyển nhanh sang Báo Hết Món */}
            <div className="flex items-center gap-2">
              {onSwitchToStockManager && (
                <button
                  type="button"
                  onClick={onSwitchToStockManager}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Mở giao diện báo hết hàng tức thời"
                >
                  <PackageX className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Báo Hết Món/Topping</span>
                  <span className="sm:hidden">Báo Hết</span>
                </button>
              )}

              <div className="relative sm:w-64 flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm tên món (croissant, trà...)"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lưới sản phẩm (Product Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
          {filteredProducts.map((product) => {
            const hasOptions = product.optionGroups && product.optionGroups.length > 0;
            const isOutOfStock = !product.isActive;
            return (
              <div
                key={product.id}
                onClick={() => !isOutOfStock && handleProductClick(product)}
                className={`group relative bg-white rounded-2xl border p-3 flex flex-col justify-between transition-all duration-200 select-none ${
                  isOutOfStock
                    ? 'border-rose-200 bg-stone-50/80 opacity-70 cursor-not-allowed'
                    : 'border-stone-200 hover:border-amber-500 hover:shadow-md cursor-pointer active:scale-[0.98]'
                }`}
              >
                {/* Product Badge */}
                {isOutOfStock ? (
                  <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                    Hết món
                  </span>
                ) : product.tag ? (
                  <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-stone-900/80 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-xs">
                    {product.tag}
                  </span>
                ) : null}

                {/* Product Image */}
                <div className="w-full aspect-square rounded-xl bg-stone-100 overflow-hidden mb-2 relative">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      isOutOfStock ? 'grayscale contrast-125 opacity-60' : 'group-hover:scale-105'
                    }`}
                    loading="lazy"
                  />
                  {!isOutOfStock && (
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-1">
                  <h4
                    className={`font-serif font-bold text-xs sm:text-sm line-clamp-1 transition-colors ${
                      isOutOfStock ? 'text-stone-400' : 'text-stone-900 group-hover:text-amber-800'
                    }`}
                  >
                    {product.name}
                  </h4>
                  <p className="text-[11px] text-stone-400 line-clamp-1">{product.description}</p>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-stone-100">
                  <span className="font-mono font-bold text-xs sm:text-sm text-amber-800">
                    {formatCurrency(product.price)}
                  </span>

                  {isOutOfStock ? (
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      Tạm hết
                    </span>
                  ) : (
                    <span
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                        hasOptions
                          ? 'bg-amber-100 text-amber-900 group-hover:bg-amber-500 group-hover:text-stone-950'
                          : 'bg-stone-900 text-amber-300 group-hover:bg-amber-600 group-hover:text-white'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{hasOptions ? 'Tùy chọn' : 'Thêm'}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CỘT PHẢI: HÓA ĐƠN & THÔNG TIN KHÁCH HÀNG (35-40% width) */}
      <div className="lg:w-5/12 flex flex-col gap-4">
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-sm flex flex-col h-full space-y-4">
          {/* Header Hóa đơn & Nút dọn giỏ */}
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-serif font-extrabold text-stone-900 text-base">
                Hóa Đơn Thu Ngân POS
              </h3>
              <span className="text-xs text-stone-400 font-mono">({cartItems.length} món)</span>
            </div>

            <button
              type="button"
              onClick={handleClearCart}
              disabled={cartItems.length === 0}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-40 disabled:hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa đơn</span>
            </button>
          </div>

          {/* Ô Nhập Số Điện Thoại & Nhận Diện Thành Viên */}
          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-600" />
                <span>Khách hàng & Tích điểm</span>
              </span>
              {matchedCustomer && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[10px] font-bold uppercase">
                  <Award className="w-3 h-3 text-purple-600" />
                  {TIER_CONFIG[matchedCustomer.tier].label}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <input
                  type="tel"
                  placeholder="Số điện thoại khách..."
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Tên khách hàng..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            {/* Hiển thị điểm khả dụng nếu đã tìm thấy khách */}
            {matchedCustomer ? (
              <div className="flex items-center justify-between text-xs bg-amber-50/70 p-2 rounded-xl border border-amber-200">
                <div className="flex items-center gap-1.5 text-amber-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    Điểm hiện có: <strong>{matchedCustomer.availablePoints} điểm</strong>
                  </span>
                </div>
                <span className="text-[10px] text-stone-500">
                  Tích x{TIER_CONFIG[matchedCustomer.tier].pointMultiplier} lần
                </span>
              </div>
            ) : (
              /* Gợi ý khách quen nhanh */
              <div className="flex flex-wrap items-center gap-1 text-[11px] text-stone-500">
                <span>Gợi ý khách quen:</span>
                {customers.slice(0, 2).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectSuggestedCustomer(c)}
                    className="px-1.5 py-0.5 rounded bg-white hover:bg-stone-200 text-stone-700 font-mono border border-stone-200 cursor-pointer"
                  >
                    {c.phone.slice(-4)} ({c.name})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Danh sách món trong hóa đơn (Bill Items) */}
          <div className="flex-1 overflow-y-auto max-h-[300px] border border-stone-100 rounded-2xl p-2 space-y-2 divide-y divide-stone-100">
            {cartItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400 space-y-1">
                <ChefHat className="w-8 h-8 text-stone-300 mx-auto" />
                <p>Hóa đơn hiện chưa có món nào.</p>
                <p className="text-[11px]">Chọn món bên trái để bắt đầu tạo đơn!</p>
              </div>
            ) : (
              cartItems.map((item, index) => (
                <div key={index} className="pt-2 first:pt-0 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-1">
                      {item.productName}
                    </div>

                    {item.optionsSummary && (
                      <div className="text-[11px] text-amber-800 font-medium">
                        {item.optionsSummary}
                      </div>
                    )}

                    {item.itemNote && (
                      <div className="text-[11px] text-stone-500 italic flex items-center gap-1 mt-0.5">
                        <MessageSquare className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>{item.itemNote}</span>
                      </div>
                    )}

                    <div className="font-mono text-xs text-stone-500 mt-0.5">
                      {formatCurrency(item.unitPrice)} / món
                    </div>
                  </div>

                  {/* Quantity & Delete */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-0.5 border border-stone-200">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(index, -1)}
                        className="w-6 h-6 rounded-lg bg-white hover:bg-stone-200 flex items-center justify-center text-stone-700 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs text-stone-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(index, 1)}
                        className="w-6 h-6 rounded-lg bg-white hover:bg-stone-200 flex items-center justify-center text-stone-700 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-stone-900">
                        {formatCurrency(item.totalPrice)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-stone-300 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Đổi điểm thưởng (Points Redemption) */}
          {matchedCustomer && matchedCustomer.availablePoints > 0 && cartItems.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900">Đổi điểm trừ tiền đơn này?</span>
                <span className="text-stone-500">
                  Có sẵn: <strong>{matchedCustomer.availablePoints} điểm</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={matchedCustomer.availablePoints}
                  step={5}
                  value={discountPointsUsed}
                  onChange={(e) =>
                    setDiscountPointsUsed(
                      Math.min(matchedCustomer.availablePoints, Math.max(0, Number(e.target.value)))
                    )
                  }
                  className="w-24 px-2.5 py-1 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900"
                />
                <span className="text-[11px] text-stone-600">
                  điểm (= giảm {formatCurrency(discountAmount)})
                </span>
                <button
                  type="button"
                  onClick={() => setDiscountPointsUsed(matchedCustomer.availablePoints)}
                  className="px-2 py-1 rounded-lg bg-white border border-stone-300 text-[10px] font-bold text-stone-700 hover:bg-stone-100 cursor-pointer ml-auto"
                >
                  Dùng hết
                </button>
              </div>
            </div>
          )}

          {/* Bảng tính tài chính (Financial Breakdown) */}
          <div className="space-y-1.5 text-xs text-stone-600 border-t border-stone-100 pt-3">
            <div className="flex items-center justify-between">
              <span>Tạm tính tiền món:</span>
              <span className="font-bold text-stone-900 font-mono">{formatCurrency(subTotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-rose-600 font-medium">
                <span>Đổi điểm giảm trừ:</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-base font-extrabold text-stone-900 pt-1 border-t border-stone-100">
              <span>Khách Cần Thanh Toán:</span>
              <span className="text-xl text-amber-800 font-mono font-black">
                {formatCurrency(orderTotal)}
              </span>
            </div>

            <div className="text-[11px] text-emerald-700 font-medium flex items-center justify-between">
              <span>Điểm tích lũy cho đơn này:</span>
              <strong>+{expectedPoints} điểm</strong>
            </div>
          </div>

          {/* Chọn Phương thức thanh toán */}
          <div className="space-y-2 pt-1 border-t border-stone-100">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
              <span>Phương thức thanh toán:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-xs'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Tiền Mặt</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('vietqr')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'vietqr'
                    ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-xs'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-sky-600" />
                <span>Chuyển Khoản VietQR</span>
              </button>
            </div>

            {/* Tính tiền thối lại nếu chọn tiền mặt */}
            {paymentMethod === 'cash' && orderTotal > 0 && (
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Tiền khách đưa:</span>
                  <input
                    type="number"
                    placeholder="VD: 100000"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value ? Number(e.target.value) : '')}
                    className="w-28 px-2 py-1 bg-white border border-stone-300 rounded-lg text-right font-mono font-bold text-stone-900"
                  />
                </div>
                {typeof cashGiven === 'number' && cashGiven >= orderTotal && (
                  <div className="flex items-center justify-between text-emerald-700 font-bold border-t border-stone-200 pt-1">
                    <span>Tiền thối lại:</span>
                    <span className="font-mono">{formatCurrency(changeMoney)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Nút hiển thị VietQR nếu chọn chuyển khoản */}
            {paymentMethod === 'vietqr' && orderTotal > 0 && (
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="w-full py-2 px-3 bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-sky-700" />
                <span>Mở Mã VietQR Cho Khách Quét Tại Quầy</span>
              </button>
            )}
          </div>

          {/* Ghi chú đơn hàng & Giao hàng */}
          <div className="space-y-1.5 text-xs">
            <input
              type="text"
              placeholder="Ghi chú đơn (VD: Cho thêm muỗng nĩa, giao trước 11h)..."
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:bg-white"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            {/* Nút 1: Bán tại quầy & Hoàn tất ngay */}
            <button
              type="button"
              onClick={() => handleProcessOrder(false)}
              disabled={cartItems.length === 0}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Xác Nhận Thu Tiền & Tích Điểm (+{expectedPoints} điểm)</span>
            </button>

            {/* Nút 2: Lên đơn giao hàng (Chốt từ Zalo / Hotline) */}
            <button
              type="button"
              onClick={() => handleProcessOrder(true)}
              disabled={cartItems.length === 0}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-amber-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>Lên Đơn Giao Hàng (Khách Đặt Zalo / Gọi Điện)</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL TÙY CHỈNH MÓN (Size, Topping, Ghi chú) */}
      <ItemCustomizationModal
        product={itemToCustomize}
        isOpen={!!itemToCustomize}
        onClose={() => setItemToCustomize(null)}
        onConfirm={handleConfirmCustomization}
      />

      {/* MODAL HIỂN THỊ VIETQR TẠI QUẦY CHO KHÁCH QUÉT */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            onClick={() => setShowQrModal(false)}
            className="fixed inset-0 bg-stone-950/75 backdrop-blur-xs transition-opacity"
          />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-sm bg-white rounded-3xl border border-stone-200 shadow-2xl p-5 text-center space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2 text-left">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-stone-900 text-sm">
                      Mã Thanh Toán VietQR
                    </h4>
                    <span className="text-[11px] text-stone-400">MBBank Quân Đội</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* VietQR Dynamic Image */}
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 flex flex-col items-center">
                <img
                  src={`https://img.vietqr.io/image/MB-${SHOP_CONFIG.bank.accountNumber}-compact2.png?amount=${orderTotal}&addInfo=TIEMBANH_POS&accountName=${encodeURIComponent(SHOP_CONFIG.bank.accountHolder)}`}
                  alt="VietQR POS"
                  className="w-52 h-52 object-contain"
                />
                <span className="text-[11px] text-stone-500 mt-2">
                  Khách mở ứng dụng ngân hàng bất kỳ để quét mã
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-xs text-stone-700 text-left bg-stone-50 p-3 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-stone-500">Số tiền:</span>
                  <strong className="font-mono text-amber-800 text-sm">
                    {formatCurrency(orderTotal)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Số tài khoản:</span>
                  <strong className="font-mono">{SHOP_CONFIG.bank.accountNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Chủ tài khoản:</span>
                  <strong>{SHOP_CONFIG.bank.accountHolder}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 bg-stone-900 text-amber-300 rounded-xl font-bold text-xs cursor-pointer hover:bg-stone-800"
              >
                Đóng Mã QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÔNG BÁO TẠO ĐƠN THÀNH CÔNG */}
      {createdSuccessOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            onClick={() => setCreatedSuccessOrder(null)}
            className="fixed inset-0 bg-stone-950/75 backdrop-blur-xs transition-opacity"
          />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="font-serif font-extrabold text-stone-900 text-xl">
                  Đã Tạo Đơn Hàng Thành Công!
                </h3>
                <p className="text-xs text-stone-500">
                  Đơn đã được lưu vào hệ thống và kích hoạt quy trình tích điểm
                </p>
              </div>

              {/* Order Info Card */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs text-left">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Mã đơn hàng:</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="font-mono font-black text-stone-900 text-base">
                      {createdSuccessOrder.orderCode}
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleCopy(createdSuccessOrder.orderCode, 'order-code')}
                      className="p-1 rounded text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      {copiedKey === 'order-code' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Khách hàng:</span>
                  <strong>{createdSuccessOrder.customerName}</strong>
                </div>

                <div className="flex items-center justify-between border-t border-amber-200/60 pt-1.5 font-bold">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="font-mono text-sm text-amber-800">
                    {formatCurrency(createdSuccessOrder.orderTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-emerald-700 font-semibold pt-0.5">
                  <span>Điểm thưởng đã cấp:</span>
                  <span>+{createdSuccessOrder.earnedPoints} điểm</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreatedSuccessOrder(null)}
                  className="flex-1 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-xl font-bold text-xs cursor-pointer transition-all"
                >
                  Tiếp Tục Tạo Đơn Mới
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreatedSuccessOrder(null);
                    onSwitchToOrdersList();
                  }}
                  className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold text-xs cursor-pointer transition-all"
                >
                  Xem Danh Sách Đơn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
