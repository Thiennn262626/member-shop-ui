import React, { useState, useEffect, useMemo } from 'react';
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
  Gift,
  User,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../../context/CartContext';
import { storeService, SHOP_CONFIG, TIER_CONFIG, calculateShippingFee } from '../../services/storeService';
import type { Customer, Order, Voucher } from '../../types';
import { formatCurrency } from '../../utils/format';

const TIER_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  MEMBER: { label: 'Hội Viên Thân Thiết', icon: '🌱', color: 'text-stone-700 bg-stone-100 border-stone-300' },
  SILVER: { label: 'Hội Viên Bạc', icon: '🥈', color: 'text-slate-800 bg-slate-100 border-slate-300' },
  GOLD: { label: 'Hội Viên Vàng', icon: '👑', color: 'text-amber-900 bg-amber-100 border-amber-300' },
  DIAMOND: { label: 'Hội Viên Kim Cương', icon: '💎', color: 'text-cyan-900 bg-cyan-100 border-cyan-300' },
};

interface CartDrawerProps {
  onOrderCreated: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOrderCreated }) => {
  const { items, isCartOpen, closeCart, updateQuantity, removeFromCart, totalAmount, estimatedPoints, clearCart } =
    useCart();

  const [shopConfig, setShopConfig] = useState(SHOP_CONFIG);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNote, setOrderNote] = useState('');

  // Thông tin hội viên & Đổi điểm thưởng
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [discountPointsUsed, setDiscountPointsUsed] = useState<number>(0);
  const [redeemedCartItemIds, setRedeemedCartItemIds] = useState<string[]>([]);

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
    let isMounted = true;
    const loadData = async () => {
      try {
        const [cfg, vouchers] = await Promise.all([
          storeService.getShopConfig(),
          storeService.getVouchers(),
        ]);
        if (isMounted) {
          if (cfg) setShopConfig(cfg);
          if (vouchers) setAvailableVouchers(vouchers.filter((v) => v.isActive));
        }
      } catch (err) {
        console.error('Failed to load shop config / vouchers:', err);
      }
    };

    loadData();

    window.addEventListener('bake_sip_config_updated', loadData);
    window.addEventListener('bake_sip_voucher_updated', loadData);
    return () => {
      isMounted = false;
      window.removeEventListener('bake_sip_config_updated', loadData);
      window.removeEventListener('bake_sip_voucher_updated', loadData);
    };
  }, []);

  // Dọn dẹp các món đã chọn đổi điểm nếu món đó bị xóa khỏi giỏ
  useEffect(() => {
    const itemIds = new Set(items.map((i) => i.id));
    setRedeemedCartItemIds((prev) => prev.filter((id) => itemIds.has(id)));
  }, [items]);

  // Xử lý đổi điểm theo tỷ lệ của tiệm
  const pointToVnd = shopConfig.pointToVndRatio || 1000;
  const customerAvailablePoints = matchedCustomer ? matchedCustomer.availablePoints : 0;

  // Tính các món trong giỏ được chọn đổi bằng điểm
  const redeemedItems = useMemo(() => {
    return items.filter((item) => redeemedCartItemIds.includes(item.id));
  }, [items, redeemedCartItemIds]);

  // Tổng số điểm cần để đổi các món đã chọn (mỗi món đổi 1 cái)
  const totalPointsRedeemedItems = useMemo(() => {
    return redeemedItems.reduce((sum, item) => {
      const pts = item.product.pointsRequiredToRedeem || Math.max(1, Math.round(item.unitPrice / pointToVnd));
      return sum + pts;
    }, 0);
  }, [redeemedItems, pointToVnd]);

  // Tổng giá trị tiền của các món được đổi bằng điểm (được giảm 100% cho 1 món)
  const itemRedemptionValue = useMemo(() => {
    return redeemedItems.reduce((sum, item) => sum + item.unitPrice, 0);
  }, [redeemedItems]);

  // Tạm tính sau khi trừ các món đổi bằng điểm
  const adjustedSubtotal = Math.max(0, totalAmount - itemRedemptionValue);

  // Số điểm còn lại có thể dùng để giảm tiền mặt (sau khi đã trừ điểm đổi món)
  const remainingPointsForCash = Math.max(0, customerAvailablePoints - totalPointsRedeemedItems);
  const maxAllowedCashDiscountPoints = Math.min(
    remainingPointsForCash,
    Math.floor(Math.max(0, adjustedSubtotal - voucherDiscount) / pointToVnd)
  );
  const validDiscountPoints = Math.min(discountPointsUsed, maxAllowedCashDiscountPoints);
  const pointsCashDiscount = validDiscountPoints * pointToVnd;

  // Tính phí ship tự động từ config theo adjustedSubtotal
  const shippingFee = calculateShippingFee(adjustedSubtotal, fulfillmentType, shopConfig);

  // Tái kiểm tra voucher khi adjustedSubtotal thay đổi
  useEffect(() => {
    let isMounted = true;
    if (appliedVoucher) {
      storeService.validateAndCalculateVoucher(appliedVoucher.code, adjustedSubtotal).then((result) => {
        if (!isMounted) return;
        if (result.isValid) {
          setVoucherDiscount(result.discountAmount);
          setVoucherError(null);
        } else {
          setAppliedVoucher(null);
          setVoucherDiscount(0);
          setVoucherError(result.message || 'Mã giảm giá không còn thỏa điều kiện đơn hàng.');
        }
      }).catch(() => {
        if (!isMounted) return;
        setAppliedVoucher(null);
        setVoucherDiscount(0);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [adjustedSubtotal, appliedVoucher]);

  const toggleRedeemItem = (cartItemId: string) => {
    if (!matchedCustomer) {
      setErrorMessage('Vui lòng nhập Số Điện Thoại để nhận diện hội viên trước khi đổi món!');
      return;
    }

    const item = items.find((i) => i.id === cartItemId);
    if (!item) return;

    const itemPts = item.product.pointsRequiredToRedeem || Math.max(1, Math.round(item.unitPrice / pointToVnd));

    if (redeemedCartItemIds.includes(cartItemId)) {
      setRedeemedCartItemIds((prev) => prev.filter((id) => id !== cartItemId));
    } else {
      if (totalPointsRedeemedItems + itemPts > customerAvailablePoints) {
        alert(`Bạn cần ít nhất ${itemPts} điểm để đổi món này. Điểm khả dụng hiện tại còn: ${customerAvailablePoints - totalPointsRedeemedItems} điểm.`);
        return;
      }
      setRedeemedCartItemIds((prev) => [...prev, cartItemId]);
    }
  };

  const handlePhoneInputChange = async (input: string) => {
    setCustomerPhone(input);
    setErrorMessage(null);
    const clean = input.trim().replace(/\D/g, '');
    if (clean.length >= 9) {
      try {
        const found = await storeService.findCustomerByPhone(clean);
        if (found) {
          setMatchedCustomer(found);
          if (!customerName.trim()) {
            setCustomerName(found.name);
          }
        } else {
          setMatchedCustomer(null);
        }
      } catch {
        setMatchedCustomer(null);
      }
    } else {
      setMatchedCustomer(null);
      setDiscountPointsUsed(0);
      setRedeemedCartItemIds([]);
    }
  };

  if (!isCartOpen) return null;

  // Áp dụng voucher
  const handleApplyVoucher = async (codeToApply?: string) => {
    setVoucherError(null);
    const code = (codeToApply || promoCodeInput).trim().toUpperCase();
    if (!code) {
      setVoucherError('Vui lòng nhập mã giảm giá');
      return;
    }

    try {
      const result = await storeService.validateAndCalculateVoucher(code, adjustedSubtotal);
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
    } catch (err: any) {
      setVoucherError(err.message || 'Lỗi khi kiểm tra mã voucher');
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
      .filter((t) => t.minOrder > adjustedSubtotal)
      .sort((a, b) => a.minOrder - b.minOrder);
    if (higherTiers.length > 0) {
      const nextTier = higherTiers[0];
      freeshipNotice = {
        needed: nextTier.minOrder - adjustedSubtotal,
        targetFee: nextTier.fee,
      };
    }
  }

  const finalTotal = Math.max(0, adjustedSubtotal - voucherDiscount - pointsCashDiscount + shippingFee);

  const handleCreateOrder = async () => {
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
      setErrorMessage('Vui lòng nhập địa chỉ giao hàng cụ thể để shipper giao món.');
      return;
    }

    if (items.length === 0) return;

    // Convert cart items to order items with redemption support
    const orderItems = items.flatMap((item) => {
      const isRedeemed = redeemedCartItemIds.includes(item.id);
      const itemPts = item.product.pointsRequiredToRedeem || Math.max(1, Math.round(item.unitPrice / pointToVnd));

      if (isRedeemed) {
        if (item.quantity === 1) {
          return [
            {
              productId: item.product.id,
              productName: item.product.name,
              unitPrice: 0,
              quantity: 1,
              totalPrice: 0,
              optionsSummary: item.optionsSummaryText ? item.optionsSummaryText.replace(/&bull;/g, ', ') : undefined,
              itemNote: item.itemNote ? `${item.itemNote} (🎁 Đổi ${itemPts} điểm)` : `🎁 Đổi ${itemPts} điểm`,
              isRedeemedWithPoints: true,
              pointsCost: itemPts,
            },
          ];
        } else {
          return [
            {
              productId: item.product.id,
              productName: `${item.product.name} (Đổi bằng điểm)`,
              unitPrice: 0,
              quantity: 1,
              totalPrice: 0,
              optionsSummary: item.optionsSummaryText ? item.optionsSummaryText.replace(/&bull;/g, ', ') : undefined,
              itemNote: item.itemNote ? `${item.itemNote} (🎁 Đổi ${itemPts} điểm)` : `🎁 Đổi ${itemPts} điểm`,
              isRedeemedWithPoints: true,
              pointsCost: itemPts,
            },
            {
              productId: item.product.id,
              productName: item.product.name,
              unitPrice: item.unitPrice,
              quantity: item.quantity - 1,
              totalPrice: item.unitPrice * (item.quantity - 1),
              optionsSummary: item.optionsSummaryText ? item.optionsSummaryText.replace(/&bull;/g, ', ') : undefined,
              itemNote: item.itemNote,
            },
          ];
        }
      }

      return [
        {
          productId: item.product.id,
          productName: item.product.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: item.unitPrice * item.quantity,
          optionsSummary: item.optionsSummaryText ? item.optionsSummaryText.replace(/&bull;/g, ', ') : undefined,
          itemNote: item.itemNote,
        },
      ];
    });

    // Gửi dữ liệu tạo đơn xuống storeService (tự động xử lý Demo hoặc API Thật)
    try {
      setIsSubmitting(true);
      const { order } = await storeService.createPendingOrder({
        customerName: customerName.trim() || `Khách ${cleanPhone.slice(-4)}`,
        customerPhone: cleanPhone,
        items: orderItems,
        note: orderNote.trim() || undefined,
        fulfillmentType,
        deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress.trim() : undefined,
        deliveryTimeType,
        deliveryScheduledTime: deliveryTimeType === 'scheduled' ? deliveryScheduledTime : undefined,
        voucherCode: appliedVoucher ? appliedVoucher.code : promoCodeInput.trim() || undefined,
        discountPointsUsed: validDiscountPoints,
        totalPointsRedeemedItems,
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
    } catch (err: any) {
      console.error('Error creating order:', err);
      setErrorMessage(err.message || 'Không thể tạo đơn hàng. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div onClick={closeCart} className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity" />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-lg bg-white border-l border-stone-200 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-3 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-stone-950 flex items-center justify-center font-bold shadow-xs">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-stone-950" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-sm sm:text-base">Giỏ Bánh Đã Chọn</h3>
                <span className="text-[11px] sm:text-xs text-stone-500">{items.length} món bánh & nước</span>
              </div>
            </div>

            <button
              onClick={closeCart}
              className="p-1.5 sm:p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 text-2xl sm:text-3xl">
                  🥐
                </div>
                <h4 className="font-serif font-bold text-stone-900 text-base sm:text-lg mb-1">Giỏ bánh đang trống trơn</h4>
                <p className="text-xs text-stone-500 max-w-xs mb-5 leading-relaxed">
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
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-stone-500 font-semibold uppercase tracking-wider">
                    <span>Món đã chọn</span>
                    <button onClick={clearCart} className="text-rose-500 hover:text-rose-700 font-normal cursor-pointer">
                      Xóa tất cả
                    </button>
                  </div>

                  <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl sm:rounded-2xl overflow-hidden bg-white">
                    {items.map((item) => (
                      <div key={item.id} className="p-2.5 sm:p-3.5 flex items-start gap-2.5 sm:gap-3">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xl bg-stone-100 shrink-0 mt-0.5"
                        />

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-stone-900 text-xs sm:text-sm leading-snug">
                            {item.product.name}
                          </h4>

                          {/* Options Breakdown */}
                          {item.optionsSummaryText && (
                            <p
                              className="text-[10px] sm:text-[11px] text-amber-800 font-medium mt-0.5 leading-tight"
                              dangerouslySetInnerHTML={{ __html: item.optionsSummaryText }}
                            />
                          )}

                          {/* Item Note */}
                          {item.itemNote && (
                            <div className="flex items-start gap-1 text-[10px] sm:text-[11px] text-stone-600 bg-stone-50 p-1 sm:p-1.5 rounded-lg mt-1 border border-stone-200/80">
                              <MessageSquare className="w-3 h-3 text-amber-700 shrink-0 mt-0.5" />
                              <span className="italic line-clamp-2">{item.itemNote}</span>
                            </div>
                          )}

                          {/* Price & Redeem Item With Points */}
                          {redeemedCartItemIds.includes(item.id) ? (
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>
                                  🎁 Đổi bằng {item.product.pointsRequiredToRedeem || Math.max(1, Math.round(item.unitPrice / pointToVnd))} điểm (0đ)
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRedeemItem(item.id)}
                                className="text-[10px] text-stone-400 hover:text-rose-600 underline cursor-pointer"
                              >
                                Hủy đổi
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <div className="text-xs font-bold text-amber-700">
                                {formatCurrency(item.unitPrice)}
                              </div>
                              {matchedCustomer && item.product.allowPointRedemption !== false && (
                                <button
                                  type="button"
                                  onClick={() => toggleRedeemItem(item.id)}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1 transition-all cursor-pointer ${
                                    customerAvailablePoints - totalPointsRedeemedItems >=
                                    (item.product.pointsRequiredToRedeem || Math.max(1, Math.round(item.unitPrice / pointToVnd)))
                                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs'
                                      : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                                  }`}
                                  title={`Đổi 1 món này bằng ${item.product.pointsRequiredToRedeem || Math.max(1, Math.round(item.unitPrice / pointToVnd))} điểm`}
                                >
                                  <Gift className="w-3 h-3 text-amber-600" />
                                  <span>
                                    Đổi: {item.product.pointsRequiredToRedeem || Math.max(1, Math.round(item.unitPrice / pointToVnd))}đ
                                  </span>
                                </button>
                              )}
                            </div>
                          )}
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
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 font-bold">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="text-[11px] sm:text-xs text-amber-950 leading-relaxed">
                    Đơn này tích lũy <strong className="font-extrabold text-amber-900">+{estimatedPoints} điểm</strong> (= {formatCurrency(estimatedPoints * SHOP_CONFIG.pointToVndRatio)}) sau khi hoàn tất!
                  </div>
                </div>

                {/* Validation Error Message */}
                {errorMessage && (
                  <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* 1. HÌNH THỨC NHẬN HÀNG (DELIVERY / PICKUP) */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-2.5 sm:space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                      Hình thức nhận hàng
                    </h4>
                    <span className="text-[10px] text-amber-800 font-semibold bg-amber-100/60 px-2 py-0.5 rounded-full">
                      Tối đa 10km
                    </span>
                  </div>

                  {/* Switch Fulfillment Tabs */}
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2 bg-stone-200/60 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFulfillmentType('delivery')}
                      className={`py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        fulfillmentType === 'delivery'
                          ? 'bg-white text-stone-900 shadow-sm'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                      <span>Giao tận nơi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFulfillmentType('pickup')}
                      className={`py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        fulfillmentType === 'pickup'
                          ? 'bg-white text-stone-900 shadow-sm'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                      <span>Đến quán lấy</span>
                    </button>
                  </div>

                  {/* Delivery Details */}
                  {fulfillmentType === 'delivery' ? (
                    <div className="space-y-2.5 sm:space-y-3 pt-0.5">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Địa chỉ giao hàng <span className="text-rose-600">*</span>
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
                          className="w-full px-3 py-1.5 sm:py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                        />
                        <p className="text-[10px] text-stone-500 mt-1">
                          📍 {shopConfig.delivery?.areaNote || 'Tiệm chỉ nhận đơn trong phạm vi 10km'}
                        </p>
                      </div>

                      {/* Thời gian nhận hàng */}
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Thời gian nhận:
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                          <button
                            type="button"
                            onClick={() => setDeliveryTimeType('asap')}
                            className={`p-1.5 sm:p-2 rounded-xl text-xs border text-left flex items-center gap-1.5 cursor-pointer transition-all ${
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
                              Tiệm sẽ căn giờ trộn bánh mới để giao đúng thời gian bạn chọn.
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
                <div className="bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-600" />
                      <span>Mã Giảm Giá / Voucher</span>
                    </h4>
                  </div>

                  {appliedVoucher ? (
                    <div className="p-2.5 sm:p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-emerald-900">
                            Mã: <span className="font-mono">{appliedVoucher.code}</span>
                          </div>
                          <div className="text-[11px] text-emerald-700">
                            Giảm {formatCurrency(voucherDiscount)} cho đơn
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
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5 sm:gap-2">
                        <div className="relative flex-1">
                          <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Mã voucher (VD: BAKESIP10)"
                            value={promoCodeInput}
                            onChange={(e) => {
                              setPromoCodeInput(e.target.value.toUpperCase());
                              setVoucherError(null);
                            }}
                            className="w-full pl-8 pr-2.5 py-1.5 sm:py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 uppercase font-mono placeholder-stone-400 focus:outline-none focus:border-amber-600"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyVoucher()}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
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
                        <div className="pt-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-stone-400">Gợi ý:</span>
                            {availableVouchers.map((v) => (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => handleApplyVoucher(v.code)}
                                className="px-2 py-0.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-[10px] font-mono font-bold text-amber-800 cursor-pointer transition-colors"
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

                {/* 3. THÔNG TIN KHÁCH HÀNG & ĐIỂM THƯỞNG HỘI VIÊN */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-2.5 sm:space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-600" />
                      <span>Thông tin người nhận & Hội viên</span>
                    </h4>
                    <span className="text-[10px] text-amber-800 font-semibold bg-amber-100/70 px-2 py-0.5 rounded-full">
                      Tích điểm tự động
                    </span>
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Số điện thoại của bạn <span className="text-rose-600 font-bold">*</span>:
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="VD: 0988111222 (Nhập để kiểm tra & dùng điểm)"
                        value={customerPhone}
                        onChange={(e) => handlePhoneInputChange(e.target.value)}
                        className="w-full px-3 py-1.5 sm:py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 font-mono shadow-2xs"
                      />
                      {matchedCustomer && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Hội viên</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* KHUNG THÔNG TIN HỘI VIÊN & ĐỔI ĐIỂM THƯỞNG */}
                  {matchedCustomer ? (
                    <div className="p-2.5 sm:p-3.5 bg-gradient-to-br from-amber-50/90 to-orange-50/70 border border-amber-300/80 rounded-xl sm:rounded-2xl space-y-2.5 sm:space-y-3 shadow-2xs animate-fade-in">
                      {/* Tiêu đề & Thông tin hội viên */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-base sm:text-lg">
                            {TIER_LABELS[matchedCustomer.tier]?.icon || '🌱'}
                          </span>
                          <div>
                            <div className="font-bold text-xs text-stone-900 flex items-center gap-1">
                              <span>{matchedCustomer.name}</span>
                              <span
                                className={`text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                                  TIER_LABELS[matchedCustomer.tier]?.color || 'bg-stone-100 text-stone-700'
                                }`}
                              >
                                {TIER_LABELS[matchedCustomer.tier]?.label || 'Hội Viên'}
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-500">
                              Hạng {matchedCustomer.tier} &bull; Tích lũy x{TIER_CONFIG[matchedCustomer.tier].pointMultiplier}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-stone-500 block">Điểm khả dụng</span>
                          <span className="font-mono font-black text-amber-900 text-xs sm:text-sm">
                            {matchedCustomer.availablePoints} điểm
                          </span>
                        </div>
                      </div>

                      {/* Khung Dùng Điểm Trừ Tiền Mặt */}
                      <div className="space-y-1.5 pt-1.5 border-t border-amber-200/70">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-950 flex items-center gap-1 text-[11px] sm:text-xs">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>Dùng điểm giảm tiền:</span>
                          </span>
                          {pointsCashDiscount > 0 && (
                            <span className="text-xs font-extrabold text-emerald-700 font-mono">
                              - {formatCurrency(pointsCashDiscount)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min={0}
                              max={maxAllowedCashDiscountPoints}
                              step={5}
                              value={discountPointsUsed || ''}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(maxAllowedCashDiscountPoints, Number(e.target.value)));
                                setDiscountPointsUsed(val);
                              }}
                              className="w-full px-2.5 py-1 sm:py-1.5 bg-white border border-stone-300 rounded-lg sm:rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-amber-600"
                              placeholder="0"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 font-bold">
                              điểm
                            </span>
                          </div>

                          {/* Quick Preset Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            {maxAllowedCashDiscountPoints >= 10 && (
                              <button
                                type="button"
                                onClick={() => setDiscountPointsUsed(Math.min(maxAllowedCashDiscountPoints, 10))}
                                className="px-1.5 sm:px-2 py-1 rounded-md sm:rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-900 cursor-pointer shadow-2xs"
                              >
                                10đ
                              </button>
                            )}
                            {maxAllowedCashDiscountPoints >= 20 && (
                              <button
                                type="button"
                                onClick={() => setDiscountPointsUsed(Math.min(maxAllowedCashDiscountPoints, 20))}
                                className="px-1.5 sm:px-2 py-1 rounded-md sm:rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-900 cursor-pointer shadow-2xs"
                              >
                                20đ
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setDiscountPointsUsed(maxAllowedCashDiscountPoints)}
                              className="px-2 py-1 rounded-md sm:rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold cursor-pointer shadow-2xs"
                            >
                              Tối đa
                            </button>
                            {discountPointsUsed > 0 && (
                              <button
                                type="button"
                                onClick={() => setDiscountPointsUsed(0)}
                                className="px-1.5 py-1 rounded-md sm:rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-[10px] text-stone-500 cursor-pointer"
                              >
                                Bỏ
                              </button>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] text-stone-500 block">
                          Tỷ lệ: 1 điểm = {formatCurrency(pointToVnd)}. Còn lại {remainingPointsForCash} điểm.
                        </span>
                      </div>

                      {/* Khung Đổi Món Bằng Điểm Trực Tiếp */}
                      {items.some((i) => i.product.allowPointRedemption !== false) && (
                        <div className="pt-1.5 border-t border-amber-200/70 space-y-1.5">
                          <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
                            <Gift className="w-3 h-3 text-amber-600" />
                            <span>Đổi món trong giỏ (0đ):</span>
                          </span>

                          <div className="space-y-1">
                            {items
                              .filter((i) => i.product.allowPointRedemption !== false)
                              .map((it) => {
                                const itPts = it.product.pointsRequiredToRedeem || Math.max(1, Math.round(it.unitPrice / pointToVnd));
                                const isRed = redeemedCartItemIds.includes(it.id);
                                return (
                                  <div
                                    key={it.id}
                                    className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-amber-200/70 text-xs"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="font-bold text-stone-900 truncate text-[11px]">
                                        {it.product.name}
                                      </div>
                                      <span className="text-[10px] text-stone-400">
                                        Gốc: {formatCurrency(it.unitPrice)}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => toggleRedeemItem(it.id)}
                                      className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0 ${
                                        isRed
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                          : customerAvailablePoints - totalPointsRedeemedItems >= itPts
                                          ? 'bg-amber-500 text-stone-950 hover:bg-amber-400 font-extrabold shadow-2xs'
                                          : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                                      }`}
                                    >
                                      {isRed ? `✅ Đã đổi (${itPts}đ)` : `🎁 Đổi (${itPts}đ)`}
                                    </button>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    customerPhone.replace(/\D/g, '').length >= 9 && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[11px] text-emerald-800">
                          SĐT mới: Tiệm sẽ tự động tích điểm cho bạn sau khi đơn hoàn tất!
                        </span>
                      </div>
                    )
                  )}

                  {/* Họ tên */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Họ tên / Nickname:
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Mai Linh, Hoàng Nam..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-1.5 sm:py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  {/* Ghi chú */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Ghi chú chung cho đơn:
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Giao trước 11h30, để đá riêng..."
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      className="w-full px-3 py-1.5 sm:py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer */}
          {items.length > 0 && (
            <div className="p-3 sm:p-5 border-t border-stone-200 bg-stone-50 space-y-2.5 sm:space-y-3.5 shrink-0">
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-stone-500 text-[11px] sm:text-xs">
                  <span>Tạm tính bánh & nước:</span>
                  <span className="font-semibold text-stone-900">{formatCurrency(totalAmount)}</span>
                </div>

                {itemRedemptionValue > 0 && (
                  <div className="flex items-center justify-between text-amber-800 font-medium text-[11px] sm:text-xs">
                    <span>Đổi {totalPointsRedeemedItems} điểm lấy món (0đ):</span>
                    <span>-{formatCurrency(itemRedemptionValue)}</span>
                  </div>
                )}

                {voucherDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-medium text-[11px] sm:text-xs">
                    <span>Giảm giá Voucher:</span>
                    <span>-{formatCurrency(voucherDiscount)}</span>
                  </div>
                )}

                {pointsCashDiscount > 0 && (
                  <div className="flex items-center justify-between text-amber-800 font-medium text-[11px] sm:text-xs">
                    <span>Đổi {validDiscountPoints} điểm trừ tiền:</span>
                    <span>-{formatCurrency(pointsCashDiscount)}</span>
                  </div>
                )}

                {fulfillmentType === 'delivery' && (
                  <div className="flex items-center justify-between text-stone-600 text-[11px] sm:text-xs">
                    <span>Phí giao hàng:</span>
                    <span className="font-semibold text-stone-900">
                      {shippingFee === 0 ? '0đ (Freeship)' : formatCurrency(shippingFee)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm sm:text-base font-bold text-stone-900 pt-1.5 border-t border-stone-200">
                  <span>Tổng thanh toán:</span>
                  <span className="text-base sm:text-xl font-black text-amber-700">{formatCurrency(finalTotal)}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-emerald-700 font-medium pt-0.5">
                  <span>Tích điểm sau đơn:</span>
                  <strong>
                    +{Math.floor(
                      (finalTotal / (shopConfig.spendToPointRatio || 10000)) *
                        (matchedCustomer ? TIER_CONFIG[matchedCustomer.tier].pointMultiplier : 1)
                    )}{' '}
                    điểm
                  </strong>
                </div>
              </div>

              {/* Action Button: Tạo đơn tạm & Lấy mã đơn */}
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={!shopConfig.isOpen || isSubmitting}
                className={`w-full py-2.5 sm:py-3.5 px-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer ${
                  !shopConfig.isOpen || isSubmitting
                    ? 'bg-stone-300 text-stone-600 border border-stone-300 cursor-not-allowed opacity-90'
                    : 'bg-stone-900 hover:bg-stone-800 text-amber-300 shadow-stone-900/20'
                }`}
              >
                {!shopConfig.isOpen ? (
                  <span>Tiệm Đang Tạm Nghỉ Bán</span>
                ) : isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Đang khởi tạo đơn hàng...</span>
                  </>
                ) : (
                  <>
                    <span>Xác Nhận Đặt Hàng & Lấy Mã Đơn</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </>
                )}
              </button>

              <p className="text-[10px] sm:text-[11px] text-center text-stone-400">
                Sau khi gửi đơn, bạn có thể gửi tin nhắn Zalo cho tiệm để xác nhận ngay!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
