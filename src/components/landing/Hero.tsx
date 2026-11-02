import React from 'react';
import { ArrowDown, CreditCard, Sparkles, Flame, CheckCircle2 } from 'lucide-react';
import { SHOP_CONFIG } from '../../services/mockDb';

interface HeroProps {
  onOpenLookup: () => void;
  onScrollToCatalog: () => void;
  onOpenWheel: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenLookup, onScrollToCatalog, onOpenWheel }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/70 via-stone-50 to-[#fdfbf7] py-10 sm:py-16 border-b border-stone-200">
      {/* Decorative Warm Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-amber-200/30 blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 left-10 w-72 h-72 rounded-full bg-orange-200/20 blur-2xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Brand Story & CTA */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
            {/* Social Proof Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-amber-200 shadow-xs text-xs font-semibold text-amber-900 mx-auto lg:mx-0">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Tiệm đang mở cửa &bull; Bánh nướng mới mỗi sáng</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl font-serif font-extrabold text-stone-900 tracking-tight leading-[1.15]">
              Mê Bánh Ngon, <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                Tích Điểm Giảm Đơn
              </span>{' '}
              Cực Đã!
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-stone-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Thưởng thức bánh sừng bò bơ Pháp, bánh mì phô mai béo ngậy cùng trà sữa ô long nướng thơm lừng. 
              Mỗi <strong className="text-stone-900">10.000đ</strong> hóa đơn = <strong className="text-amber-700">1 điểm thưởng</strong>, 
              trừ tiền trực tiếp khi chốt đơn qua Zalo!
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3 pt-2">
              <button
                onClick={onScrollToCatalog}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>Xem Menu Bánh Hôm Nay</span>
                <ArrowDown className="w-4 h-4 text-amber-400" />
              </button>

              <button
                onClick={onOpenLookup}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 font-bold text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Tra Cứu Thẻ Điểm</span>
              </button>
            </div>

            {/* Micro Highlights */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-3 text-xs text-stone-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>1 Điểm = 1.000đ tiền mặt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Chốt đơn Zalo trong 30s</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Không cần tải app</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Loyalty Highlight Box */}
          <div className="lg:col-span-5">
            <div className="relative bg-white/90 backdrop-blur-sm border border-amber-200/80 rounded-3xl p-6 sm:p-7 shadow-xl shadow-amber-900/5 space-y-5">
              {/* Box Top */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-stone-900 text-sm">
                      Đặc Quyền Hội Viên {SHOP_CONFIG.shopName}
                    </h3>
                    <span className="text-[11px] text-stone-500">Tự động tích theo SĐT</span>
                  </div>
                </div>

                <button
                  onClick={onOpenWheel}
                  className="px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse"
                >
                  Quay Thưởng 🎁
                </button>
              </div>

              {/* 3 Steps */}
              <div className="space-y-3.5">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50/70 border border-amber-100">
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 text-xs">Chọn món & Gửi Zalo</div>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      Thêm bánh vào giỏ, bấm gửi đơn là hệ thống tự soạn tin nhắn gửi thẳng tiệm.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                  <div className="w-7 h-7 rounded-xl bg-stone-900 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 text-xs">Tự động tích điểm theo SĐT</div>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      Tiệm chốt đơn và cộng điểm ngay. Bạn có thể mở web nhập SĐT để ngắm số điểm nhảy!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 text-xs">Trừ tiền hoặc đổi bánh xịn</div>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      Lần tới mua chỉ cần bảo tiệm: "Trừ điểm giúp mình nha!", đơn hàng tự động giảm giá ngay.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Hotline */}
              <div className="pt-2 flex items-center justify-between text-xs text-stone-500 border-t border-stone-100">
                <span className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Hotline & Zalo:
                </span>
                <a
                  href={`https://zalo.me/${SHOP_CONFIG.zaloPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-amber-800 hover:underline"
                >
                  {SHOP_CONFIG.hotline}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
