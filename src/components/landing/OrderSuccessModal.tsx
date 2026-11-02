import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, Send, Clock, Sparkles } from 'lucide-react';
import { SHOP_CONFIG } from '../../services/mockDb';
import type { Order } from '../../types';
import { formatCurrency } from '../../utils/format';

interface OrderSuccessModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder: (phone: string) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  isOpen,
  onClose,
  onTrackOrder,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(order.orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToZalo = () => {
    const text = `Chào tiệm ${SHOP_CONFIG.shopName}! Mình vừa đặt đơn hàng mã ${order.orderCode} (${order.customerName} - ${order.customerPhone}). Tiệm kiểm tra và xác nhận làm bánh giúp mình nhé! Cảm ơn tiệm!`;
    const encoded = encodeURIComponent(text);
    const url = `https://zalo.me/${SHOP_CONFIG.zaloPhone}?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-stone-950/75 backdrop-blur-xs transition-opacity" />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden text-center p-5 sm:p-6 space-y-5 animate-fade-in my-6">
          {/* Success Icon */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="space-y-1">
            <h3 className="font-serif font-extrabold text-stone-900 text-xl sm:text-2xl">
              Đã Lưu Đơn Hàng Tạm!
            </h3>
            <p className="text-xs sm:text-sm text-stone-600">
              Gửi mã đơn bên dưới sang Zalo để tiệm xác nhận & làm bánh ngay nhé.
            </p>
          </div>

          {/* Big Order Code Card */}
          <div className="bg-amber-50/80 border-2 border-dashed border-amber-300 rounded-2xl p-4 space-y-2">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-widest block">
              Mã Đơn Hàng Của Bạn
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-stone-900">
                {order.orderCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 transition-colors cursor-pointer shadow-2xs"
                title="Sao chép mã đơn"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-[11px] text-amber-800 font-medium">
              {copied ? 'Đã sao chép mã đơn vào bộ nhớ tạm!' : 'Bấm icon để sao chép mã nhanh'}
            </div>
          </div>

          {/* Quick Summary */}
          <div className="bg-stone-50 rounded-2xl p-3.5 text-xs text-stone-600 space-y-2 text-left border border-stone-200/80">
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Khách hàng:</span>
              <strong className="text-stone-900">{order.customerName} ({order.customerPhone})</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Số lượng:</span>
              <span className="text-stone-900">{order.items.length} món bánh & nước</span>
            </div>
            <div className="flex items-center justify-between border-t border-stone-200 pt-2 font-bold text-stone-900">
              <span>Tổng thanh toán:</span>
              <span className="text-sm text-amber-800">{formatCurrency(order.orderTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-emerald-700 text-[11px] font-semibold">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Tích điểm sau khi tiệm xác nhận:
              </span>
              <span>+{order.earnedPoints} điểm</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleSendToZalo}
              className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Gửi Mã Đơn Sang Zalo Tiệm Ngay</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onTrackOrder(order.customerPhone);
              }}
              className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Theo Dõi Trạng Thái Đơn Hàng</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-stone-500 hover:text-stone-800 font-medium transition-colors"
          >
            Đóng thông báo & Tiếp tục lướt tiệm
          </button>
        </div>
      </div>
    </div>
  );
};
