import React, { useState, useEffect } from 'react';
import { ShoppingBag, CreditCard, Store, Gift } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { mockDb } from '../../services/mockDb';

interface HeaderProps {
  onOpenMemberLookup: () => void;
  onOpenWheel: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMemberLookup, onOpenWheel, onOpenAdmin }) => {
  const { totalItems, openCart } = useCart();
  const [shopConfig, setShopConfig] = useState(() => mockDb.getShopConfig());

  useEffect(() => {
    const handleUpdate = () => setShopConfig(mockDb.getShopConfig());
    window.addEventListener('bake_sip_config_updated', handleUpdate);
    return () => window.removeEventListener('bake_sip_config_updated', handleUpdate);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-stone-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 text-lg">
              🥐
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-stone-900 block leading-tight">
                  {shopConfig.shopName}
                </span>

                {shopConfig.isOpen ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Đang mở bán
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Tạm nghỉ bán
                  </span>
                )}
              </div>
              <span className="text-[11px] sm:text-xs text-stone-500 font-medium">
                {shopConfig.tagline}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Nút Vòng quay săn quà */}
            <button
              onClick={onOpenWheel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs sm:text-sm font-semibold border border-purple-200 transition-all active:scale-95 cursor-pointer"
              title="Quay thưởng nhận quà mỗi ngày"
            >
              <Gift className="w-4 h-4 text-purple-600 animate-bounce" />
              <span className="hidden md:inline">Săn Quà</span>
            </button>

            {/* Tra cứu thẻ điểm */}
            <button
              onClick={onOpenMemberLookup}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-800 text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Thẻ Hội Viên</span>
              <span className="sm:hidden">Điểm</span>
            </button>

            {/* Giỏ bánh */}
            <button
              onClick={openCart}
              className="relative inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Giỏ Bánh</span>
              {totalItems > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold leading-none text-stone-900 bg-amber-400 rounded-full">
                  {totalItems}
                </span>
              )}
            </button>

            {/* POS Quản lý cho chủ tiệm */}
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="Cổng Đăng Nhập Quản Lý & Bán Hàng POS"
            >
              <Store className="w-4 h-4 text-amber-700" />
              <span className="hidden sm:inline">Quản lý</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
