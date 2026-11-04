import React, { useState } from 'react';
import {
  ArrowDown,
  CreditCard,
  Sparkles,
  Flame,
  CheckCircle2,
  ChevronRight,
  X,
  ShoppingBag,
  Ticket,
  QrCode,
  MessageCircle,
  Coffee,
  Check,
} from 'lucide-react';
import { SHOP_CONFIG } from '../../constants/shopConstants';

interface HeroProps {
  onOpenLookup: () => void;
  onScrollToCatalog: () => void;
  onOpenWheel: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenLookup, onScrollToCatalog, onOpenWheel }) => {
  const [isOrderGuideOpen, setIsOrderGuideOpen] = useState(false);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/70 via-stone-50 to-[#fdfbf7] py-4 sm:py-16 border-b border-stone-200">
      {/* Decorative Warm Ambient Glows */}
      <div className="hidden sm:block absolute top-0 right-1/4 w-96 h-96 rounded-full bg-amber-200/30 blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="hidden sm:block absolute bottom-0 left-10 w-72 h-72 rounded-full bg-orange-200/20 blur-2xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12 items-center">
          {/* Left Column: Brand Story & CTA */}
          <div className="lg:col-span-7 space-y-2.5 sm:space-y-6 text-center lg:text-left">
            {/* Social Proof Pill (Chỉ hiện trên desktop/tablet để tiết kiệm chiều dọc điện thoại) */}
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-amber-200 shadow-xs text-xs font-semibold text-amber-900 mx-auto lg:mx-0">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Tiệm đang mở cửa &bull; Bánh nướng mới mỗi sáng</span>
            </div>

            {/* Main Headline (Font size tinh gọn, chuẩn app hiện đại trên mobile) */}
            <h1 className="text-xl sm:text-5xl font-serif font-extrabold text-stone-900 tracking-tight leading-tight">
              Mê Bánh Ngon, <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                Tích Điểm Giảm Đơn
              </span>{' '}
              Cực Đã!
            </h1>

            {/* Description (Rút gọn tối đa trên mobile để khách thấy thực đơn ngay) */}
            <p className="hidden sm:block text-sm sm:text-base text-stone-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Thưởng thức bánh sừng bò bơ Pháp, bánh mì phô mai béo ngậy cùng trà sữa ô long nướng thơm lừng. 
              Mỗi <strong className="text-stone-900">10.000đ</strong> hóa đơn = <strong className="text-amber-700">1 điểm thưởng</strong>, 
              trừ tiền trực tiếp khi chốt đơn qua Zalo!
            </p>
            <p className="sm:hidden text-xs text-stone-600 leading-tight max-w-xs mx-auto">
              Mỗi 10k tích 1 điểm &bull; Đổi bánh 0đ hoặc trừ tiền khi chốt đơn!
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 sm:pt-2">
              <button
                onClick={onScrollToCatalog}
                className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>Xem Menu Bánh</span>
                <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              </button>

              <button
                type="button"
                onClick={() => setIsOrderGuideOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Xem hướng dẫn quy trình đặt đơn"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Hướng Dẫn 💡</span>
              </button>

              <button
                onClick={onOpenLookup}
                className="hidden sm:inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 font-bold text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Tra Cứu Thẻ Điểm</span>
              </button>
            </div>

            {/* Micro Highlights (Ẩn trên mobile để giao diện thông thoáng) */}
            <div className="hidden sm:flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-3 text-xs text-stone-500 font-medium">
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

          {/* Right Column: Interactive Loyalty Highlight Box (Ẩn trên mobile để hiển thị menu ngay tức thì) */}
          <div className="lg:col-span-5 hidden lg:block">
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
                {/* Step 1 with Attention-Grabbing Wiggle Animation & Clickable Popup Guide */}
                <button
                  type="button"
                  onClick={() => setIsOrderGuideOpen(true)}
                  className="w-full text-left flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100/90 border-2 border-amber-400 hover:border-amber-500 shadow-md shadow-amber-200/50 cursor-pointer transition-all active:scale-[0.98] group relative overflow-hidden animate-soft-wiggle focus:outline-none focus:ring-2 focus:ring-amber-500"
                  title="Nhấp để xem hướng dẫn chi tiết quy trình mua hàng"
                >
                  {/* Glowing Corner Accent */}
                  <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-amber-300/40 to-transparent pointer-events-none rounded-tr-2xl" />

                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs group-hover:scale-110 transition-transform">
                    1
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5 flex-wrap">
                        <span>Chọn món & Gửi Zalo</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-900 font-extrabold text-[10px] tracking-wide group-hover:bg-amber-300 transition-colors shadow-2xs">
                          <Sparkles className="w-2.5 h-2.5 text-amber-700" />
                          <span>Chạm xem hướng dẫn</span>
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                    <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                      Thêm bánh vào giỏ, bấm gửi đơn là hệ thống tự soạn tin nhắn gửi thẳng tiệm.
                    </p>
                  </div>
                </button>

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

      {/* Gentle & Elegant Order Guide Popup Modal */}
      {isOrderGuideOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-opacity"
          onClick={() => setIsOrderGuideOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-amber-100 animate-gentle-modal overflow-hidden relative max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4 shrink-0">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>HƯỚNG DẪN MUA HÀNG & ĐẶT MÓN</span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                  Quy Trình Đặt Bánh & Gửi Đơn Siêu Tốc
                </h3>
                <p className="text-xs sm:text-sm text-stone-500">
                  Chỉ với 4 bước đơn giản – Tự chọn khẩu vị, nhận bánh nóng tận nơi!
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOrderGuideOpen(false)}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer shrink-0"
                aria-label="Đóng popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="overflow-y-auto py-4 space-y-3.5 pr-1 text-left">
              {/* Step 1 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 hover:border-amber-300 transition-all">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  1
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <Coffee className="w-4 h-4 text-amber-600" />
                    <span>Chọn Món & Tùy Biến Khẩu Vị</span>
                  </h4>
                  <p className="text-stone-600 leading-relaxed">
                    Lướt danh mục bánh nướng & trà tươi. Bấm vào món để tùy chọn <strong>Size M / L</strong>, 
                    chỉnh mức <strong>độ ngọt (0% – 100%)</strong>, <strong>lượng đá</strong> (hoặc uống nóng), 
                    chọn thêm <strong>topping</strong> (trân châu, kem cheese) và ghi chú riêng cho tiệm.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 hover:border-amber-200 transition-all">
                <div className="w-8 h-8 rounded-xl bg-stone-800 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  2
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-stone-700" />
                    <span>Mở Giỏ Hàng & Chọn Hình Thức Nhận</span>
                  </h4>
                  <p className="text-stone-600 leading-relaxed">
                    Chọn <strong>Nhận tại quán (0đ phí ship)</strong> hoặc <strong>Giao hàng tận nơi (khu vực 10km)</strong>. 
                    Bạn có thể chọn <strong>giao ngay</strong> hoặc <strong>hẹn ngày & giờ cụ thể</strong> để tiệm nướng bánh nóng đúng giờ tiệc/họp.
                  </p>
                  <div className="inline-block mt-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-medium text-[11px] border border-emerald-100">
                    🛵 <em>Đồng giá ship thông minh: Đơn từ 200.000đ được Miễn phí giao hàng (Freeship)!</em>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 hover:border-amber-200 transition-all">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  3
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-purple-600" />
                    <span>Áp Dụng Mã Giảm Giá & Tích Điểm VIP</span>
                  </h4>
                  <p className="text-stone-600 leading-relaxed">
                    Nhập mã khuyến mãi (nếu có) để nhận ưu đãi. Nhập <strong>Số điện thoại</strong> để hệ thống tự động tra cứu điểm thưởng và trừ tiền trực tiếp vào hóa đơn (1 điểm = 1.000đ).
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 hover:border-amber-300 transition-all">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  4
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-amber-700" />
                    <span>Bấm Gửi Đơn – Tiệm Soạn Zalo & VietQR Tức Thì</span>
                  </h4>
                  <p className="text-stone-600 leading-relaxed">
                    Chọn thanh toán <strong>Quét mã VietQR động</strong> (tự điền số tiền và mã đơn chuẩn xác) hoặc <strong>Tiền mặt (COD)</strong> khi nhận bánh. 
                    Hệ thống sẽ cấp mã đơn <span className="font-mono font-bold text-amber-800">#BS-xxxx</span> và hỗ trợ bạn gửi tin nhắn trực tiếp qua Zalo tiệm để xác nhận nhanh nhất!
                  </p>
                </div>
              </div>

              {/* Bonus Tip Box */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 text-xs text-stone-700 space-y-1">
                <div className="font-bold text-amber-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Theo Dõi Tiến Trình Làm Bánh & Pha Chế:</span>
                </div>
                <p className="text-[11px] text-stone-600">
                  Bạn có thể bấm nút <strong>"Tra Cứu Đơn Hàng"</strong> ở đầu trang bất cứ lúc nào để xem trực tiếp bếp đang nướng bánh hay tài xế đang giao đến nhé!
                </p>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="border-t border-stone-100 pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
              <a
                href={`https://zalo.me/${SHOP_CONFIG.zaloPhone}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat Zalo Tiệm: {SHOP_CONFIG.hotline}</span>
              </a>

              <div className="w-full sm:w-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOrderGuideOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Đã Hiểu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOrderGuideOpen(false);
                    onScrollToCatalog();
                  }}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Chọn Món Ngay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
