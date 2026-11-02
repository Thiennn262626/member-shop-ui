import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, Sparkles, Tag, MessageSquare, ArrowRight, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../../context/CartContext';
import { mockDb, SHOP_CONFIG } from '../../services/mockDb';
import type { Order } from '../../types';
import { formatCurrency } from '../../utils/format';

interface CartDrawerProps {
  onOrderCreated: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOrderCreated }) => {
  const { items, isCartOpen, closeCart, updateQuantity, removeFromCart, totalAmount, estimatedPoints, clearCart } =
    useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handleCreateOrder = () => {
    setErrorMessage(null);

    // Validate phone number
    const cleanPhone = customerPhone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorMessage('Vui lòng nhập số điện thoại (tối thiểu 9-10 chữ số) để tạo mã đơn & tích điểm.');
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

    // Create pending order in Mock DB
    const { order } = mockDb.createPendingOrder({
      customerName: customerName.trim() || `Khách ${cleanPhone.slice(-4)}`,
      customerPhone: cleanPhone,
      items: orderItems,
      note: orderNote.trim() || undefined,
      promoCode: promoCode.trim() || undefined,
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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white border-l border-stone-200 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-stone-950 flex items-center justify-center font-bold shadow-xs">
                <ShoppingBag className="w-5 h-5 text-stone-950" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Giỏ Bánh Đã Chọn
                </h3>
                <span className="text-xs text-stone-500">
                  {items.length} món bánh & nước
                </span>
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
                <h4 className="font-serif font-bold text-stone-900 text-lg mb-1">
                  Giỏ bánh đang trống trơn
                </h4>
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
                    <button
                      onClick={clearCart}
                      className="text-rose-500 hover:text-rose-700 font-normal cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  </div>

                  <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                    {items.map((item) => (
                      <div key={item.id} className="p-3.5 flex items-start gap-3">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-13 h-13 object-cover rounded-xl bg-stone-100 shrink-0 mt-0.5"
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

                          {/* Individual Item Note */}
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
                    Đơn hàng này tích lũy <strong className="font-extrabold text-amber-900">+{estimatedPoints} điểm thưởng</strong> (= {formatCurrency(estimatedPoints * SHOP_CONFIG.pointToVndRatio)}) cho số điện thoại của bạn sau khi tiệm xác nhận!
                  </div>
                </div>

                {/* Validation Error Message */}
                {errorMessage && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Customer Information Input */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center justify-between">
                    <span>Thông tin đặt hàng</span>
                    <span className="text-[10px] text-amber-800 font-semibold">Tự động tạo mã đơn</span>
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
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Họ tên / Nickname:
                    </label>
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
                      Mã Voucher / Quà săn được (nếu có):
                    </label>
                    <div className="relative">
                      <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="VD: BONUS10P, BANH15K..."
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 uppercase font-mono placeholder-stone-400 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Ghi chú chung cho toàn bộ đơn:
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Giao trước 11h30 trưa, gọi trước khi đến..."
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
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Tạm tính tiền bánh & nước:</span>
                  <span className="font-semibold text-stone-900">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-bold text-stone-900 pt-1.5 border-t border-stone-200">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-lg font-black text-amber-700">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              {/* Action Button: Tạo đơn tạm & Lấy mã đơn */}
              <button
                type="button"
                onClick={handleCreateOrder}
                className="w-full py-3.5 px-4 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-stone-900/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>Xác Nhận Đặt Hàng & Lấy Mã Đơn</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>

              <p className="text-[11px] text-center text-stone-400">
                Hệ thống sẽ lưu đơn và cấp mã đơn ngắn gọn để bạn gửi sang Zalo cho tiệm chốt nhanh!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
