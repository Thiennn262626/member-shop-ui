import React, { useEffect, useState } from 'react';
import { Sparkles, ShoppingBag, X } from 'lucide-react';

interface ActivityItem {
  id: number;
  user: string;
  action: string;
  item: string;
  points: string;
  timeAgo: string;
  type: 'earn' | 'redeem' | 'tier';
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: 1,
    user: 'Linh Đan (090xxx82)',
    action: 'vừa tích lũy',
    item: '2x Bánh Croissant bơ Pháp',
    points: '+14 điểm',
    timeAgo: '12 giây trước',
    type: 'earn',
  },
  {
    id: 2,
    user: 'Hoàng Long (097xxx41)',
    action: 'vừa đổi điểm giảm 30k',
    item: 'Bánh Mì Bơ Tỏi Phô Mai',
    points: '-30 điểm',
    timeAgo: '1 phút trước',
    type: 'redeem',
  },
  {
    id: 3,
    user: 'Hà My (093xxx19)',
    action: 'vừa thăng hạng',
    item: 'Thành Viên Vàng 👑',
    points: '+25 điểm',
    timeAgo: '2 phút trước',
    type: 'tier',
  },
  {
    id: 4,
    user: 'Tuấn Kiệt (098xxx65)',
    action: 'vừa chốt đơn Zalo',
    item: 'Trà Sữa Ô Long + Bánh Tart',
    points: '+12 điểm',
    timeAgo: '3 phút trước',
    type: 'earn',
  },
];

export const LiveActivityToast: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isDismissed) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ACTIVITIES.length);
        setIsVisible(true);
      }, 500);
    }, 7000);

    return () => clearInterval(interval);
  }, [isDismissed]);

  if (isDismissed) return null;

  const current = ACTIVITIES[currentIndex];

  return (
    <div
      className={`fixed bottom-20 sm:bottom-6 left-4 z-30 max-w-xs sm:max-w-sm transition-all duration-500 transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div className="bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-2xl p-3 shadow-xl flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            current.type === 'tier'
              ? 'bg-amber-100 text-amber-700'
              : current.type === 'redeem'
              ? 'bg-rose-100 text-rose-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {current.type === 'tier' ? (
            <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
          ) : (
            <ShoppingBag className="w-4 h-4" />
          )}
        </div>

        <div className="flex-1 min-w-0 text-xs">
          <div className="flex items-center justify-between gap-1">
            <span className="font-semibold text-stone-900 truncate">{current.user}</span>
            <span className="text-[10px] text-stone-400 shrink-0">{current.timeAgo}</span>
          </div>
          <p className="text-stone-600 truncate mt-0.5">
            {current.action} <span className="font-medium text-stone-800">{current.item}</span>
          </p>
          <span
            className={`font-mono font-bold text-[11px] ${
              current.points.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {current.points}
          </span>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="text-stone-400 hover:text-stone-700 p-1 -mr-1 rounded-md transition-colors cursor-pointer"
          title="Đóng thông báo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
