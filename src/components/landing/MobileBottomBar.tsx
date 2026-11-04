import React from 'react';
import { UtensilsCrossed, CreditCard, ShoppingBag, MessageCircle, Gift } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { SHOP_CONFIG } from '../../constants/shopConstants';
import { formatCurrency } from '../../utils/format';

interface MobileBottomBarProps {
  onOpenLookup: () => void;
  onOpenWheel: () => void;
  onScrollToMenu: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  onOpenLookup,
  onOpenWheel,
  onScrollToMenu,
}) => {
  const { totalItems, totalAmount, openCart } = useCart();

  return (
    <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-3 py-2 shadow-2xl safe-area-pb">
      <div className="flex items-center justify-around gap-1">
        {/* Nút Xem Menu */}
        <button
          onClick={onScrollToMenu}
          className="flex flex-col items-center justify-center p-1 text-stone-600 hover:text-amber-800 transition-colors"
        >
          <UtensilsCrossed className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Thực Đơn</span>
        </button>

        {/* Nút Tra cứu Thẻ */}
        <button
          onClick={onOpenLookup}
          className="flex flex-col items-center justify-center p-1 text-stone-600 hover:text-amber-800 transition-colors"
        >
          <CreditCard className="w-5 h-5 text-amber-600" />
          <span className="text-[10px] font-medium mt-0.5">Thẻ Điểm</span>
        </button>

        {/* Nút Vòng Quay May Mắn */}
        <button
          onClick={onOpenWheel}
          className="flex flex-col items-center justify-center p-1 text-stone-600 hover:text-purple-700 transition-colors relative"
        >
          <div className="relative">
            <Gift className="w-5 h-5 text-purple-600 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <span className="text-[10px] font-medium mt-0.5">Săn Quà</span>
        </button>

        {/* Nút Chat Zalo */}
        <a
          href={`https://zalo.me/${SHOP_CONFIG.zaloPhone}`}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center p-1 text-sky-600 hover:text-sky-700 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Chat Zalo</span>
        </a>

        {/* Nút Giỏ Hàng Nổi Bật */}
        <button
          onClick={openCart}
          className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 text-white shadow-md active:scale-95 transition-all"
        >
          <ShoppingBag className="w-4 h-4 text-amber-400" />
          <div className="text-left">
            <div className="text-[10px] text-stone-300 leading-none">
              {totalItems > 0 ? `${totalItems} món` : 'Giỏ'}
            </div>
            {totalItems > 0 && (
              <div className="text-xs font-bold text-amber-300 leading-tight">
                {formatCurrency(totalAmount)}
              </div>
            )}
          </div>
          {totalItems > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
