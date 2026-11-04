import React from 'react';
import { X, Sparkles, Award, Gift, CheckCircle2, ArrowRight, Flame } from 'lucide-react';
import { useShopStore } from '../../stores/useShopStore';
import { TIER_CONFIG } from '../../constants/shopConstants';
import { formatCurrency } from '../../utils/format';
import type { MemberTier } from '../../types';

interface LoyaltyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLookup?: () => void;
}

export const LoyaltyPolicyModal: React.FC<LoyaltyPolicyModalProps> = ({
  isOpen,
  onClose,
  onOpenLookup,
}) => {
  const shopConfig = useShopStore((state) => state.shopConfig);

  if (!isOpen) return null;

  const spendToPointRatio = shopConfig.spendToPointRatio || 10000;
  const pointToVndRatio = shopConfig.pointToVndRatio || 500;
  const cashbackPercent = ((pointToVndRatio / spendToPointRatio) * 100).toFixed(0);

  const tiers: { key: MemberTier; badge: string; colorClass: string; borderClass: string; bgCard: string }[] = [
    {
      key: 'MEMBER',
      badge: 'Thành viên mới',
      colorClass: 'text-stone-800',
      borderClass: 'border-stone-200',
      bgCard: 'bg-stone-50/80',
    },
    {
      key: 'SILVER',
      badge: 'Thân thiết',
      colorClass: 'text-slate-700',
      borderClass: 'border-slate-300',
      bgCard: 'bg-slate-50/80',
    },
    {
      key: 'GOLD',
      badge: 'Khách VIP',
      colorClass: 'text-amber-800',
      borderClass: 'border-amber-300',
      bgCard: 'bg-amber-50/60',
    },
    {
      key: 'DIAMOND',
      badge: 'VVIP Đẳng Cấp',
      colorClass: 'text-purple-900',
      borderClass: 'border-purple-300',
      bgCard: 'bg-purple-50/60',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans animate-fade-in">
      <div onClick={onClose} className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity" />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-stone-950 flex items-center justify-center font-bold shadow-xs">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Chính Sách & Quyền Lợi Hội Viên
                </h3>
                <span className="text-[11px] sm:text-xs text-stone-500">
                  {shopConfig.shopName} &bull; Tích lũy tự động theo Số Điện Thoại
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
            {/* Core Ratios Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                  Tỷ Lệ Tích Điểm
                </span>
                <div className="my-1.5">
                  <span className="text-xl sm:text-2xl font-black font-mono text-stone-900">
                    {formatCurrency(spendToPointRatio)}
                  </span>
                  <span className="text-xs text-stone-600 block mt-0.5">= <strong>1 Điểm Thưởng</strong></span>
                </div>
                <span className="text-[10px] text-amber-800">
                  Tích tự động theo SĐT khi đặt đơn
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                  Quy Đổi Tiền Mặt
                </span>
                <div className="my-1.5">
                  <span className="text-xl sm:text-2xl font-black font-mono text-stone-900">
                    {formatCurrency(pointToVndRatio)}
                  </span>
                  <span className="text-xs text-stone-600 block mt-0.5">/ <strong>1 Điểm Thưởng</strong></span>
                </div>
                <span className="text-[10px] text-emerald-800">
                  Khấu trừ trực tiếp vào hóa đơn
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-orange-50/80 border border-orange-200/80 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-orange-900 uppercase tracking-wider block">
                  Tỷ Lệ Hoàn Tiền
                </span>
                <div className="my-1.5">
                  <span className="text-xl sm:text-2xl font-black font-mono text-stone-900">
                    {cashbackPercent}% - {((pointToVndRatio * 1.5 / spendToPointRatio) * 100).toFixed(1)}%
                  </span>
                  <span className="text-xs text-stone-600 block mt-0.5">Tùy theo hạng thẻ thành viên</span>
                </div>
                <span className="text-[10px] text-orange-800">
                  Càng ăn nhiều, hoàn tiền càng cao!
                </span>
              </div>
            </div>

            {/* 2 Ways to Redeem Points */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-600" />
                <span>2 Hình Thức Sử Dụng Điểm Thưởng Linh Hoạt</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-stone-600">
                <div className="p-2.5 rounded-xl bg-white border border-stone-200/80 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-900 block">Cách 1: Trừ Tiền Mặt Hóa Đơn</strong>
                    <span>Nhập số điểm muốn đổi tại Giỏ Hàng để được giảm trừ tương ứng (1 điểm = {formatCurrency(pointToVndRatio)}).</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-stone-200/80 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-900 block">Cách 2: Đổi Món Ăn Miễn Phí</strong>
                    <span>Chọn các món có huy hiệu Đổi Điểm trong Thực Đơn để thưởng thức miễn phí 100% bằng điểm tích lũy.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Membership Tiers Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Bảng Xếp Hạng & Quyền Lợi 4 Hạng Thẻ
                </h4>
                <span className="text-[11px] text-stone-500">Tự động nâng hạng theo chi tiêu</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tiers.map(({ key, badge, colorClass, borderClass, bgCard }) => {
                  const info = TIER_CONFIG[key];
                  return (
                    <div
                      key={key}
                      className={`p-3.5 rounded-2xl border ${borderClass} ${bgCard} flex flex-col justify-between space-y-3 transition-all hover:shadow-xs`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                              {badge}
                            </span>
                            <h5 className={`font-serif font-bold text-sm sm:text-base ${colorClass}`}>
                              {info.label}
                            </h5>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${info.badgeColor}`}>
                            x{info.pointMultiplier} Điểm
                          </span>
                        </div>

                        <div className="mt-2 text-xs text-stone-600">
                          Chi tiêu tích lũy:{' '}
                          <strong className="font-mono text-stone-900">
                            {info.minSpent === 0 ? 'Từ 0đ' : `Từ ${formatCurrency(info.minSpent)}`}
                          </strong>
                        </div>
                      </div>

                      <div className="border-t border-stone-200/60 pt-2 space-y-1">
                        {info.perks.map((perk, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-stone-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span>{perk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* How to Join */}
            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs text-stone-700 flex items-start gap-2.5">
              <Flame className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-900 block font-semibold">Làm thế nào để trở thành Hội Viên?</strong>
                <p className="text-stone-600 mt-0.5 leading-relaxed">
                  Rất đơn giản! Quý khách chỉ cần nhập <strong>Số Điện Thoại</strong> của mình khi tạo đơn hàng. Ngay sau khi tiệm xác nhận hoàn tất đơn, hệ thống sẽ tự động tạo hồ sơ và tích lũy điểm thưởng tương ứng mà không cần đăng ký tài khoản rườm rà.
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs shrink-0">
            {onOpenLookup ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLookup();
                }}
                className="inline-flex items-center gap-1.5 text-amber-800 font-bold hover:underline cursor-pointer"
              >
                <span>Tra cứu thẻ & điểm của bạn</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-[11px] text-stone-500">Chính sách áp dụng trên toàn hệ thống</span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold transition-all cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
