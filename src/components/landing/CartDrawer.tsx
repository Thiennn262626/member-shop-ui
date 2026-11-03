import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  Tag,
  MessageSquare,
  ArrowRight,
  AlertCircle,
  Truck,
  Store,
  Clock,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../../context/CartContext';
import { mockDb, SHOP_CONFIG } from '../../services/mockDb';
import type { Order, Voucher } from '../../types';
import { formatCurrency } from '../../utils/format';

interface CartDrawerProps {
  onOrderCreated: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOrderCreated }) => {
  const { items, isCartOpen, closeCart, updateQuantity, removeFromCart, totalAmount, estimatedPoints, clearCart } =
    useCart();

  const [shopConfig, setShopConfig] = useState(() => mockDb.getShopConfig() || SHOP_CONFIG);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNote, setOrderNote] = useState('');

  // Giao hàng / Nhận tại quán
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryTimeType, setDeliveryTimeType] = useState<'asap' | 'scheduled'>('asap');
  const [deliveryScheduledTime, setDeliveryScheduledTime] = useState('');

  // Voucher
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState<number>(0);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load shop config & active vouchers
  useEffect(() => {
    const handleConfig = () => {
      const cfg = mockDb.getShopConfig();
      setShopConfig(cfg);
    };
    const handleVoucher = () => {
      setAvailableVouchers(mockDb.getVouchers().filter((v) => v.isActive));
    };

    handleConfig();
    handleVoucher();

    window.addEventListener('bake_sip_config_updated', handleConfig);
    window.addEventListener('bake_sip_voucher_updated', handleVoucher);
    return () => {
      window.removeEventListener('bake_sip_config_updated', handleConfig);
      window.removeEventListener('bake_sip_voucher_updated', handleVoucher);
    };
  }, []);

  // Tính phí ship tự động từ mockDb (không hardcode)
  const shippingFee = mockDb.calculateShippingFee(totalAmount, fulfillmentType);

  // Tái kiểm tra voucher khi subtotal thay đổi
  useEffect(() => {
    if (appliedVoucher) {
      const result = mockDb.validateAndCalculateVoucher(appliedVoucher.code, totalAmount);
      if (result.isValid) {
        setVoucherDiscount(result.discountAmount);
        setVoucherError(null);
      } else {
        setAppliedVoucher(null);
        setVoucherDiscount(0);
        setVoucherError(result.message || 'Mã giảm giá không còn thỏa điều kiện đơn hàng.');
      }
    }
  }, [totalAmount, appliedVoucher]);

  if (!isCartOpen) return null;

  // Áp dụng voucher
  const handleApplyVoucher = (codeToApply?: string) => {
    setVoucherError(null);
    const code = (codeToApply || promoCodeInput).trim().toUpperCase();
    if (!code) {
      setVoucherError('Vui lòng nhập mã giảm giá');
      return;
    }

    const result = mockDb.validateAndCalculateVoucher(code, totalAmount);
    if (result.isValid) {
      setAppliedVoucher(result.voucher || null);
      setVoucherDiscount(result.discountAmount);
      setPromoCodeInput(code);
      setVoucherError(null);
    } else {
      setAppliedVoucher(null);
      setVoucherDiscount(0);
      setVoucherError(result.message || 'Mã giảm giá không hợp lệ');
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherDiscount(0);
    setPromoCodeInput('');
    setVoucherError(null);
  };

  // Tính toán khuyến khích Freeship
  const deliveryConfig = shopConfig.delivery;
  let freeshipNotice: { needed: number; targetFee: number } | null = null;
  if (fulfillmentType === 'delivery' && deliveryConfig && deliveryConfig.tiers) {
    const higherTiers = deliveryConfig.tiers
      .filter((t) => t.minOrder > totalAmount)
      .sort((a, b) => a.minOrder - b.minOrder);
    if (higherTiers.length > 0) {
      const nextTier = higherTiers[0];
      freeshipNotice = {
        needed: nextTier.minOrder - totalAmount,
        targetFee: nextTier.fee,
      };
    }
  }

  const finalTotal = Math.max(0, totalAmount - voucherDiscount + shippingFee);

  const handleCreateOrder = () => {
    setErrorMessage(null);

    if (!shopConfig.isOpen) {
      setErrorMessage(
        shopConfig.pauseReason || 'Hôm nay tiệm đang tạm nghỉ bán. Hẹn gặp lại quý khách vào ngày mai!'
      );
      return;
    }

    // Validate phone number
    const cleanPhone = customerPhone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorMessage('Vui lòng nhập số điện thoại (tối thiểu 9-10 chữ số) để lưu đơn & tích điểm.');
      return;
    }

    // Validate address if delivery
    if (fulfillmentType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ giao hàng cụ thể để shipper giao bánh.');
      return;
    }

    if (items.length === 0) return;

    // Convert cart items to order items
    const orderItems = items.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      totalPrice: item.unitPrice * item.quantity,
      optionsSummary: item.optionsSummaryText ? item.optionsSummaryText.replace(/&bull;/g, ', ') : undefined,
      itemNote: item.itemNote,
    }));

    // Gửi dữ liệu tạo đơn xuống MockDB (Backend mô phỏng sẽ tính toán lại phí ship và voucher an toàn)
    const { order } = mockDb.createPendingOrder({
      customerName: customerName.trim() || `Khách ${cleanPhone.slice(-4)}`,
      customerPhone: cleanPhone,
      items: orderItems,
      note: orderNote.trim() || undefined,
      fulfillmentType,
      deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress.trim() : undefined,
      deliveryTimeType,
      deliveryScheduledTime: deliveryTimeType === 'scheduled' ? deliveryScheduledTime : undefined,
      voucherCode: appliedVoucher ? appliedVoucher.code : promoCodeInput.trim() || undefined,
    });

    // Confetti celebration
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
    });

    clearCart();
    closeCart();
    onOrderCreated(order);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div onClick={closeCart} className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity" />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-lg bg-white border-l border-stone-200 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-stone-950 flex items-center justify-center font-bold shadow-xs">
                <ShoppingBag className="w-5 h-5 text-stone-950" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base">Giỏ Bánh Đã Chọn</h3>
                <span className="text-xs text-stone-500">{items.length} món bánh & nước</span>
              </div>
            </div>

            <button
              onClick={closeCart}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 text-3xl">
                  🥐
                </div>
                <h4 className="font-serif font-bold text-stone-900 text-lg mb-1">Giỏ bánh đang trống trơn</h4>
                <p className="text-xs text-stone-500 max-w-xs mb-6 leading-relaxed">
                  Lướt qua thực đơn bánh nóng giòn thơm bơ và chọn món để chuẩn bị chốt đơn nhé.
                </p>
                <button
                  onClick={closeCart}
                  className="px-5 py-2.5 bg-stone-900 text-amber-300 rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Xem Thực Đơn Ngay
                </button>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-500 font-semibold uppercase tracking-wider">
                    <span>Món đã chọn</span>
                    <button onClick={clearCart} className="text-rose-500 hover:text-rose-700 font-normal cursor-pointer">
                      Xóa tất cả
                    </button>
                  </div>

                  <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                    {items.map((item) => (
                      <div key={item.id} className="p-3.5 flex items-start gap-3">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-14 h-14 object-cover rounded-xl bg-stone-100 shrink-0 mt-0.5"
                        />

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-stone-900 text-xs sm:text-sm leading-snug">
                            {item.product.name}
                          </h4>

                          {/* Options Breakdown */}
                          {item.optionsSummaryText && (
                            <p
                              className="text-[11px] text-amber-800 font-medium mt-0.5 leading-tight"
                              dangerouslySetInnerHTML={{ __html: item.optionsSummaryText }}
                            />
                          )}

                          {/* Item Note */}
                          {item.itemNote && (
                            <div className="flex items-start gap-1 text-[11px] text-stone-600 bg-stone-50 p-1.5 rounded-lg mt-1 border border-stone-200/80">
                              <MessageSquare className="w-3 h-3 text-amber-700 shrink-0 mt-0.5" />
                              <span className="italic line-clamp-2">{item.itemNote}</span>
                            </div>
                          )}

                          <div className="text-xs font-bold text-amber-700 mt-1">
                            {formatCurrency(item.unitPrice)}
                          </div>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50 shrink-0">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-stone-900 font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                          title="Xóa món"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Loyalty Point Incentive Banner */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-amber-950 leading-relaxed">
                    Đơn hàng này tích lũy <strong className="font-extrabold text-amber-900">+{estimatedPoints} điểm thưởng</strong> (= {formatCurrency(estimatedPoints * SHOP_CONFIG.pointToVndRatio)}) sau khi hoàn tất!
                  </div>
                </div>

                {/* Validation Error Message */}
                {errorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* 1. HÌNH THỨC NHẬN HÀNG (DELIVERY / PICKUP) */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                      Hình thức nhận hàng
                    </h4>
                    <span className="text-[10px] text-amber-800 font-semibold bg-amber-100/60 px-2 py-0.5 rounded-full">
                      Bán kính tối đa 10km
                    </span>
                  </div>

                  {/* Switch Fulfillment Tabs */}
                  <div className="grid grid-cols-2 gap-2 bg-stone-200/60 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFulfillmentType('delivery')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        fulfillmentType === 'delivery'
                          ? 'bg-white text-stone-900 shadow-sm'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Truck className="w-4 h-4 text-amber-600" />
                      <span>Giao hàng tận nơi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFulfillmentType('pickup')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        fulfillmentType === 'pickup'
                          ? 'bg-white text-stone-900 shadow-sm'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Store className="w-4 h-4 text-amber-600" />
                      <span>Đến quán lấy</span>
                    </button>
                  </div>

                  {/* Delivery Details */}
                  {fulfillmentType === 'delivery' ? (
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Địa chỉ giao hàng chi tiết <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Số nhà, tên đường, phường, quận..."
                          value={deliveryAddress}
                          onChange={(e) => {
                            setDeliveryAddress(e.target.value);
                            setErrorMessage(null);
                          }}
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                        />
                        <p className="text-[10px] text-stone-500 mt-1">
                          📍 {shopConfig.delivery?.areaNote || 'Tiệm chỉ nhận đơn trong phạm vi 10km quanh Phú Nhuận'}
                        </p>
                      </div>

                      {/* Thời gian nhận hàng */}
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          Thời gian giao hàng:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setDeliveryTimeType('asap')}
                            className={`p-2 rounded-xl text-xs border text-left flex items-center gap-2 cursor-pointer transition-all ${
                              deliveryTimeType === 'asap'
                                ? 'border-amber-500 bg-amber-50/50 text-stone-900 font-bold'
                                : 'border-stone-200 bg-white text-stone-600'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Giao ngay (~30-45p)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeliveryTimeType('scheduled')}
                            className={`p-2 rounded-xl text-xs border text-left flex items-center gap-2 cursor-pointer transition-all ${
                              deliveryTimeType === 'scheduled'
                                ? 'border-amber-500 bg-amber-50/50 text-stone-900 font-bold'
                                : 'border-stone-200 bg-white text-stone-600'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                            <span>Hẹn ngày giờ</span>
                          </button>
                        </div>

                        {deliveryTimeType === 'scheduled' && (
                          <div className="mt-2">
                            <input
                              type="datetime-local"
                              value={deliveryScheduledTime}
                              onChange={(e) => setDeliveryScheduledTime(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                            />
                            <p className="text-[10px] text-stone-500 mt-1">
                              Tiệm sẽ căn giờ nướng bánh mới để giao đúng thời gian bạn chọn.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Freeship Progress Indicator */}
                      {freeshipNotice && (
                        <div className="p-2.5 rounded-xl bg-amber-100/50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                          <span>
                            🛒 Mua thêm <strong>{formatCurrency(freeshipNotice.needed)}</strong> để phí ship chỉ còn{' '}
                            <strong>{freeshipNotice.targetFee === 0 ? '0đ (Freeship)' : formatCurrency(freeshipNotice.targetFee)}</strong>!
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-stone-200 text-xs space-y-1 text-stone-600">
                      <div className="font-bold text-stone-800">Địa chỉ tiệm: {shopConfig.address}</div>
                      <div>Bánh sẽ được chuẩn bị sẵn sau 15-20 phút, bạn có thể ghé lấy bất cứ lúc nào!</div>
                    </div>
                  )}
                </div>

                {/* 2. MÃ KHUYẾN MÃI / VOUCHER */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-600" />
                      <span>Mã Khuyến Mãi / Voucher</span>
                    </h4>
                  </div>

                  {appliedVoucher ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <div>
                          <div className="text-xs font-bold text-emerald-900">
                            Đã áp dụng mã: <span className="font-mono">{appliedVoucher.code}</span>
                          </div>
                          <div className="text-[11px] text-emerald-700">
                            Giảm {formatCurrency(voucherDiscount)} cho đơn hàng
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveVoucher}
                        className="text-xs text-stone-400 hover:text-rose-600 font-medium p-1 cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Nhập mã voucher (VD: BAKESIP10)"
                            value={promoCodeInput}
                            onChange={(e) => {
                              setPromoCodeInput(e.target.value.toUpperCase());
                              setVoucherError(null);
                            }}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 uppercase font-mono placeholder-stone-400 focus:outline-none focus:border-amber-600"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyVoucher()}
                          className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                        >
                          Áp dụng
                        </button>
                      </div>

                      {voucherError && (
                        <div className="text-[11px] text-rose-600 font-medium px-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{voucherError}</span>
                        </div>
                      )}

                      {/* Quick voucher chips */}
                      {availableVouchers.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[10px] text-stone-400 block mb-1.5">Mã gợi ý cho bạn:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {availableVouchers.map((v) => (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => handleApplyVoucher(v.code)}
                                className="px-2 py-1 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-[10px] font-mono font-bold text-amber-800 cursor-pointer transition-colors"
                              >
                                {v.code}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. THÔNG TIN KHÁCH HÀNG & GHI CHÚ */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center justify-between">
                    <span>Thông tin liên hệ</span>
                    <span className="text-[10px] text-amber-800 font-semibold">Tự động tích điểm theo SĐT</span>
                  </h4>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Số điện thoại của bạn <span className="text-rose-600 font-bold">*</span>:
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="VD: 0988111222 (Bắt buộc để lưu đơn & tích điểm)"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        setErrorMessage(null);
                      }}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 font-mono shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Họ tên / Nickname:</label>
                    <input
                      type="text"
                      placeholder="VD: Mai Linh"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Ghi chú chung cho toàn bộ đơn:
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Giao trước 11h30, để đá riêng, gọi trước khi đến..."
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 space-y-3.5">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-stone-500">
                  <span>Tạm tính tiền bánh & nước:</span>
                  <span className="font-semibold text-stone-900">{formatCurrency(totalAmount)}</span>
                </div>

                {voucherDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-medium">
                    <span>Giảm giá Voucher:</span>
                    <span>-{formatCurrency(voucherDiscount)}</span>
                  </div>
                )}

                {fulfillmentType === 'delivery' && (
                  <div className="flex items-center justify-between text-stone-600">
                    <span>Phí giao hàng (đồng giá theo mốc):</span>
                    <span className="font-semibold text-stone-900">
                      {shippingFee === 0 ? '0đ (Freeship)' : formatCurrency(shippingFee)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-xl font-black text-amber-700">{formatCurrency(finalTotal)}</span>
                </div>
              </div>

              {/* Action Button: Tạo đơn tạm & Lấy mã đơn */}
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={!shopConfig.isOpen}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer ${
                  !shopConfig.isOpen
                    ? 'bg-rose-100 text-rose-800 border border-rose-300 cursor-not-allowed opacity-90'
                    : 'bg-stone-900 hover:bg-stone-800 text-amber-300 shadow-stone-900/20'
                }`}
              >
                {!shopConfig.isOpen ? (
                  <span>Tiệm Đang Tạm Nghỉ Bán Hôm Nay</span>
                ) : (
                  <>
                    <span>Xác Nhận Đặt Hàng & Lấy Mã Đơn</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-stone-400">
                Sau khi gửi đơn, bạn có thể kiểm tra đơn hàng và thanh toán VietQR ngay khi tiệm duyệt!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
