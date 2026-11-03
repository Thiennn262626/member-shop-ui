import React, { useMemo, useState, useEffect } from 'react';
import { Search, Sparkles, Star, SlidersHorizontal, ShoppingBag, Store, Gift } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { mockDb, SHOP_CONFIG } from '../../services/mockDb';
import type { Product, SelectedOptionChoice, ShopConfig } from '../../types';
import { formatCurrency } from '../../utils/format';
import { ItemCustomizationModal } from './ItemCustomizationModal';

interface ProductCatalogProps {
  products: Product[];
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ products }) => {
  const {
    addItemToCart,
    getItemQuantity,
    totalItems,
    totalAmount,
    openCart,
    lastAddedName,
  } = useCart();

  const [shopConfig, setShopConfig] = useState<ShopConfig>(() => mockDb.getShopConfig());
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [animatingProductId, setAnimatingProductId] = useState<string | null>(null);

  // Sync shop config when admin toggles open/pause
  useEffect(() => {
    const handleConfig = () => setShopConfig(mockDb.getShopConfig());
    window.addEventListener('bake_sip_config_updated', handleConfig);
    return () => window.removeEventListener('bake_sip_config_updated', handleConfig);
  }, []);

  const categories = useMemo(() => {
    const list = ['Tất cả'];
    products.forEach((p) => {
      if (p.category && !list.includes(p.category)) {
        list.push(p.category);
      }
    });
    return list;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = selectedCategory === 'Tất cả' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const triggerAddAnimation = (productId: string) => {
    setAnimatingProductId(productId);
    setTimeout(() => setAnimatingProductId(null), 600);
  };

  const handleOpenCustomization = (product: Product) => {
    if (!shopConfig.isOpen || !product.isActive) return;
    setCustomizingProduct(product);
  };

  const handleCustomizationConfirm = (payload: {
    product: Product;
    quantity: number;
    selectedOptions: SelectedOptionChoice[];
    itemNote?: string;
  }) => {
    addItemToCart(payload);
    triggerAddAnimation(payload.product.id);
  };

  return (
    <section id="catalog-section" className="py-3 sm:py-14 bg-[#fcfbfa]">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        {/* BANNER NẾU TIỆM TẠM NGHỈ BÁN HÔM NAY */}
        {!shopConfig.isOpen && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-rose-50 border border-rose-300 shadow-xs flex items-start sm:items-center gap-3 animate-fade-in">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 font-bold shadow-md shadow-rose-500/20">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-serif font-black text-rose-950 text-xs sm:text-base">
                  Tiệm Tạm Nghỉ Bán Hôm Nay
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase bg-rose-200 text-rose-900">
                  Tạm ngưng
                </span>
              </div>
              <p className="text-[11px] sm:text-sm text-rose-800 mt-0.5">
                {shopConfig.pauseReason || 'Hôm nay tiệm tạm ngưng nhận đơn online để chuẩn bị nguyên liệu. Hẹn gặp lại quý khách!'}
              </p>
            </div>
          </div>
        )}

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2.5 sm:gap-4 mb-3 sm:mb-8">
          <div>
            <div className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-full mb-2">
              <Sparkles className="w-3 h-3 text-amber-700" />
              Menu Bánh Tươi & Đồ Uống
            </div>
            <h2 className="text-base sm:text-3xl font-serif font-extrabold text-stone-900 tracking-tight">
              Thực Đơn Bánh Tươi & Nước
            </h2>
            <p className="hidden sm:block text-xs sm:text-sm text-stone-600 mt-1">
              Tùy chọn kích thước, topping và ghi chú riêng cho từng món trước khi chốt đơn Zalo
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm món bánh, nước..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 sm:py-2.5 bg-white border border-stone-300 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 shadow-xs transition-all"
            />
          </div>
        </div>

        {/* Category Pills (Mobile horizontal scroll) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 sm:pb-3 mb-3 sm:mb-8 scrollbar-none -mx-2.5 px-2.5 sm:mx-0 sm:px-0">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-stone-900 text-amber-300 shadow-md shadow-stone-900/10'
                    : 'bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Product Grid: 2 columns on mobile, 3 on tablet, 4 on desktop */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-8 sm:p-12 text-center">
            <p className="text-stone-500 text-xs sm:text-sm">Chưa tìm thấy món nào khớp với từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6">
            {filteredProducts.map((product) => {
              const currentQuantity = getItemQuantity(product.id);
              const earnedPoints = Math.floor(product.price / SHOP_CONFIG.spendToPointRatio);
              const isAnimating = animatingProductId === product.id;

              return (
                <div
                  key={product.id}
                  className={`bg-white border rounded-2xl sm:rounded-3xl overflow-hidden transition-all flex flex-col group relative ${
                    !product.isActive
                      ? 'border-stone-300 bg-stone-50/70 opacity-80'
                      : currentQuantity > 0
                      ? 'border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30'
                      : 'border-stone-200/90 hover:border-amber-400 hover:shadow-lg'
                  }`}
                >
                  {/* Image Container with Badges */}
                  <div
                    onClick={() => handleOpenCustomization(product)}
                    className={`relative aspect-4/3 sm:aspect-square bg-stone-100 overflow-hidden ${
                      !product.isActive || !shopConfig.isOpen ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className={`w-full h-full object-cover transition-transform duration-500 ${
                        !product.isActive ? 'grayscale contrast-125 opacity-60' : 'group-hover:scale-105'
                      }`}
                      loading="lazy"
                    />

                    {/* Tag (Bán chạy / Mới ra lò / Signature) */}
                    {product.tag && product.isActive && (
                      <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-stone-900/90 backdrop-blur-xs text-amber-300 text-[9px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg shadow-xs">
                        {product.tag}
                      </span>
                    )}

                    {/* Out of stock overlay */}
                    {!product.isActive ? (
                      <div className="absolute inset-0 bg-stone-950/50 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-center">
                        <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-rose-600 text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-wider shadow-lg">
                          🔴 Tạm Hết
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-stone-200 mt-0.5 font-medium">Hẹn bạn hôm sau</span>
                      </div>
                    ) : (
                      /* Point Reward Badge */
                      <span className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 inline-flex items-center gap-0.5 bg-amber-400/95 backdrop-blur-xs text-stone-950 font-extrabold text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg shadow-xs">
                        <Sparkles className="w-2.5 h-2.5" />
                        +{earnedPoints}đ
                      </span>
                    )}

                    {/* Floating Add Effect Ripple */}
                    {isAnimating && (
                      <div className="absolute inset-0 bg-amber-400/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none animate-ping">
                        <span className="text-stone-950 font-black text-[11px] sm:text-sm bg-amber-400 px-2.5 py-0.5 rounded-full shadow-lg">
                          +1 vào giỏ
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-2 sm:p-4 flex-1 flex flex-col justify-between space-y-1.5 sm:space-y-3">
                    <div>
                      {/* Rating & Sold count */}
                      <div className="flex items-center justify-between text-[9px] sm:text-xs text-stone-500 mb-0.5 sm:mb-1">
                        <span className="flex items-center gap-0.5 font-bold text-amber-600">
                          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
                          {product.rating}
                        </span>
                        <span>Đã bán {product.soldCount}</span>
                      </div>

                      <h3
                        onClick={() => handleOpenCustomization(product)}
                        className={`font-serif font-bold text-stone-900 text-xs sm:text-base leading-tight line-clamp-1 sm:line-clamp-2 ${
                          !product.isActive || !shopConfig.isOpen
                            ? 'cursor-not-allowed opacity-75'
                            : 'group-hover:text-amber-800 transition-colors cursor-pointer hover:underline'
                        }`}
                      >
                        {product.name}
                      </h3>

                      <p className="text-[11px] sm:text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed hidden sm:block">
                        {product.description}
                      </p>
                    </div>

                    {/* Price and Action Button */}
                    <div className="pt-1.5 sm:pt-2 border-t border-stone-100 flex items-center justify-between gap-1">
                      <div>
                        <div className="text-xs sm:text-base font-extrabold text-stone-900 font-mono">
                          {formatCurrency(product.price)}
                        </div>
                        {product.fakePrice && product.fakePrice > product.price && (
                          <div className="text-[9px] sm:text-xs text-stone-400 line-through font-mono">
                            {formatCurrency(product.fakePrice)}
                          </div>
                        )}
                        {product.allowPointRedemption && (
                          <div className="mt-0.5">
                            <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-1 py-0.5 rounded shadow-2xs">
                              <Gift className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-amber-700" />
                              <span>Đổi: {product.pointsRequiredToRedeem || Math.round(product.price / (shopConfig.pointToVndRatio || 1000))}đ</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Nút bấm mở Tùy chọn Món & Ghi chú */}
                      {!shopConfig.isOpen ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold bg-stone-200 text-stone-500 cursor-not-allowed"
                          title="Tiệm đang tạm nghỉ bán hôm nay"
                        >
                          <span>Nghỉ</span>
                        </button>
                      ) : !product.isActive ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 cursor-not-allowed"
                          title="Món này hiện đang tạm hết nguyên liệu"
                        >
                          <span>Hết</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenCustomization(product)}
                          className={`inline-flex items-center gap-1 px-2 py-1 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                            currentQuantity > 0
                              ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-xs'
                              : 'bg-stone-900 hover:bg-stone-800 text-amber-300 shadow-xs'
                          }`}
                          title="Tùy chọn size, topping & ghi chú"
                        >
                          <SlidersHorizontal className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span>
                            {currentQuantity > 0 ? (
                              <>
                                <span className="sm:hidden">+{currentQuantity}</span>
                                <span className="hidden sm:inline">Đã chọn ({currentQuantity})</span>
                              </>
                            ) : (
                              <>
                                <span className="sm:hidden">+ Chọn</span>
                                <span className="hidden sm:inline">Tùy chọn</span>
                              </>
                            )}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Tùy chọn Món & Ghi chú (Cho TẤT CẢ các món) */}
        <ItemCustomizationModal
          product={customizingProduct}
          isOpen={customizingProduct !== null}
          onClose={() => setCustomizingProduct(null)}
          onConfirm={handleCustomizationConfirm}
        />

        {/* FLOATING CART BAR: HIỂN THỊ KHI ĐÃ CÓ MÓN TRONG GIỎ */}
        {totalItems > 0 && (
          <div className="fixed bottom-16 sm:bottom-6 inset-x-0 z-30 px-3 sm:px-4 flex justify-center pointer-events-none">
            <div className="pointer-events-auto max-w-md w-full bg-stone-900/95 backdrop-blur-md text-white rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-2xl border border-amber-500/40 flex items-center justify-between gap-3 animate-bounce-subtle">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-9 h-9 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 font-bold">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                    {totalItems}
                  </span>
                </div>
                <div className="truncate">
                  <div className="text-xs text-stone-300 truncate">
                    {lastAddedName ? `Vừa thêm: ${lastAddedName}` : `Đã chọn ${totalItems} món bánh & nước`}
                  </div>
                  <div className="text-sm font-extrabold text-amber-300 font-mono">
                    {formatCurrency(totalAmount)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={openCart}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
              >
                Xem Giỏ & Gửi Zalo 👉
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
