import React from 'react';
import { Phone, MapPin, MessageSquare, ShieldCheck, Clock, Award, Sparkles } from 'lucide-react';
import { useShopStore } from '../../stores/useShopStore';
import { formatCurrency } from '../../utils/format';

interface FooterProps {
  onOpenPolicy?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPolicy }) => {
  const shopConfig = useShopStore((state) => state.shopConfig);

  return (
    <footer className="bg-stone-900 text-stone-400 py-10 sm:py-14 border-t border-stone-800 text-xs pb-24 sm:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-stone-800">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-stone-950 flex items-center justify-center font-bold text-lg">
                🌶️
              </div>
              <div>
                <span className="font-serif text-lg font-bold tracking-tight block leading-none">
                  {shopConfig.shopName}
                </span>
                <span className="text-[11px] text-amber-400/90 font-medium mt-0.5 block">
                  {shopConfig.tagline}
                </span>
              </div>
            </div>
            <p className="text-stone-400 max-w-sm leading-relaxed text-xs">
              Tiệm bánh tráng trộn phơi sương Tây Ninh & đồ ăn vặt chuẩn vị. Tích lũy điểm thưởng tự động trên từng đơn hàng chốt nhanh qua Zalo.
            </p>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-4 space-y-2.5">
            <h4 className="text-stone-200 font-bold uppercase tracking-wider text-xs">
              Liên Hệ & Ghé Tiệm
            </h4>
            <div className="flex items-center gap-2 text-stone-300">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Hotline: <strong>{shopConfig.hotline}</strong></span>
            </div>
            <div className="flex items-start gap-2 text-stone-300">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{shopConfig.address}</span>
            </div>
            <div className="flex items-center gap-2 text-stone-300">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Giờ mở cửa: <strong>09:00 - 22:00 (Mỗi ngày)</strong></span>
            </div>
            <div className="flex items-center gap-2 text-stone-300">
              <MessageSquare className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Zalo Đặt Hàng: <strong>{shopConfig.zaloPhone}</strong></span>
            </div>
          </div>

          {/* Loyalty Policy */}
          <div className="md:col-span-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-stone-200 font-bold uppercase tracking-wider text-xs">
                Chính Sách Hội Viên
              </h4>
              {onOpenPolicy && (
                <button
                  type="button"
                  onClick={onOpenPolicy}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Xem chi tiết</span>
                </button>
              )}
            </div>
            <div className="space-y-1.5 text-stone-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{formatCurrency(shopConfig.spendToPointRatio || 10000)} = 1 điểm thưởng</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>1 điểm = {formatCurrency(shopConfig.pointToVndRatio || 500)} khấu trừ tiền mặt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Đổi món miễn phí & nhân điểm tới x1.5 lần</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Tự động tích điểm theo SĐT khi đặt đơn</span>
              </div>
            </div>
            {onOpenPolicy && (
              <button
                type="button"
                onClick={onOpenPolicy}
                className="mt-2 w-full py-1.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700/80 text-amber-300 text-[11px] font-bold border border-stone-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Bảng quyền lợi 4 hạng thẻ & hoàn tiền</span>
              </button>
            )}
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-stone-500">
          <div>
            &copy; {new Date().getFullYear()} {shopConfig.shopName}. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Thiết kế tối ưu trải nghiệm điện thoại</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
