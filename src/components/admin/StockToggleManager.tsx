import React, { useState, useMemo, useEffect } from 'react';
import {
  PackageCheck,
  PackageX,
  Search,
  Sparkles,
  CheckCircle2,
  Coffee,
  Layers,
  Power,
  Flame,
  UtensilsCrossed,
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import { useShopStore } from '../../stores/useShopStore';
import type { GlobalOptionItem, Product } from '../../types';
import { formatCurrency } from '../../utils/format';

export const StockToggleManager: React.FC = () => {
  const products = useShopStore((state) => state.products);
  const shopConfig = useShopStore((state) => state.shopConfig);
  const setShopConfig = useShopStore((state) => state.setShopConfig);
  const fetchProducts = useShopStore((state) => state.fetchProducts);
  const fetchShopConfig = useShopStore((state) => state.fetchShopConfig);
  const [optionsList, setOptionsList] = useState<GlobalOptionItem[]>([]);

  // Active sub-tab: 'products' | 'toppings'
  const [activeTab, setActiveTab] = useState<'products' | 'toppings'>('products');

  // Product Filters
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [productStatusFilter, setProductStatusFilter] = useState<'ALL' | 'ACTIVE' | 'OUT_OF_STOCK'>('ALL');

  // Topping Filters
  const [toppingSearch, setToppingSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('Tất cả');
  const [toppingStatusFilter, setToppingStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OUT_OF_STOCK'>('ALL');

  // Pause Reason edit state
  const [pauseReasonInput, setPauseReasonInput] = useState(
    'Hôm nay tiệm tạm ngưng nhận đơn online để chuẩn bị nguyên liệu.'
  );
  const [isEditingReason, setIsEditingReason] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync with Realtime Events
  const refreshAll = async () => {
    try {
      await Promise.all([fetchProducts(), fetchShopConfig()]);
      const optList = await storeService.getGlobalOptionsList();
      setOptionsList(optList);
      if (shopConfig?.pauseReason) {
        setPauseReasonInput(shopConfig.pauseReason);
      }
    } catch (err) {
      console.error('Failed to refresh stock toggle manager:', err);
    }
  };

  useEffect(() => {
    refreshAll();
    const handleForceRefresh = () => {
      fetchProducts(true);
      fetchShopConfig(true);
      storeService.getGlobalOptionsList().then(setOptionsList);
    };
    window.addEventListener('bake_sip_product_updated', handleForceRefresh);
    window.addEventListener('bake_sip_config_updated', handleForceRefresh);
    return () => {
      window.removeEventListener('bake_sip_product_updated', handleForceRefresh);
      window.removeEventListener('bake_sip_config_updated', handleForceRefresh);
    };
  }, [fetchProducts, fetchShopConfig]);

  // --- STATS METRICS ---
  const activeProductsCount = useMemo(() => products.filter((p) => p.isActive).length, [products]);
  const outOfStockProductsCount = useMemo(() => products.filter((p) => !p.isActive).length, [products]);

  const availableToppingsCount = useMemo(() => optionsList.filter((o) => o.isAvailable).length, [optionsList]);
  const outOfStockToppingsCount = useMemo(() => optionsList.filter((o) => !o.isAvailable).length, [optionsList]);

  // Categories list for filter
  const categories = useMemo(() => {
    const list = ['Tất cả'];
    products.forEach((p) => {
      if (p.category && !list.includes(p.category)) {
        list.push(p.category);
      }
    });
    return list;
  }, [products]);

  // Option groups list for filter
  const optionGroups = useMemo(() => {
    const list = ['Tất cả'];
    optionsList.forEach((o) => {
      if (o.groupName && !list.includes(o.groupName)) {
        list.push(o.groupName);
      }
    });
    return list;
  }, [optionsList]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Tất cả' || p.category === selectedCategory;
      const matchSearch =
        !productSearch.trim() ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(productSearch.toLowerCase());
      const matchStatus =
        productStatusFilter === 'ALL' ||
        (productStatusFilter === 'ACTIVE' && p.isActive) ||
        (productStatusFilter === 'OUT_OF_STOCK' && !p.isActive);
      return matchCat && matchSearch && matchStatus;
    });
  }, [products, selectedCategory, productSearch, productStatusFilter]);

  // Filtered Toppings
  const filteredToppings = useMemo(() => {
    return optionsList.filter((o) => {
      const matchGroup = selectedGroup === 'Tất cả' || o.groupName === selectedGroup;
      const matchSearch =
        !toppingSearch.trim() ||
        o.name.toLowerCase().includes(toppingSearch.toLowerCase()) ||
        o.groupName.toLowerCase().includes(toppingSearch.toLowerCase());
      const matchStatus =
        toppingStatusFilter === 'ALL' ||
        (toppingStatusFilter === 'AVAILABLE' && o.isAvailable) ||
        (toppingStatusFilter === 'OUT_OF_STOCK' && !o.isAvailable);
      return matchGroup && matchSearch && matchStatus;
    });
  }, [optionsList, selectedGroup, toppingSearch, toppingStatusFilter]);

  // --- ACTIONS ---

  // 1. Toggle single product stock
  const handleToggleProduct = async (p: Product) => {
    try {
      const updated = await storeService.toggleProductStatus(p.id);
      await refreshAll();
      showToast(
        updated.isActive
          ? `🟢 Món "${p.name}" đã ĐƯỢC BẬT BÁN LẠI thành công!`
          : `🔴 Đã BÁO HẾT MÓN "${p.name}" (Khách không thể chọn)!`
      );
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Batch toggle products
  const handleBatchToggleProducts = async (isActive: boolean) => {
    const categoryLabel = selectedCategory === 'Tất cả' ? 'tất cả các món' : `danh mục "${selectedCategory}"`;
    const actionLabel = isActive ? 'BẬT BÁN LẠI' : 'BÁO HẾT HÀNG TOÀN BỘ';

    if (window.confirm(`Bạn có chắc chắn muốn ${actionLabel} cho ${categoryLabel} không?`)) {
      try {
        await storeService.toggleAllProductsStatus(isActive, selectedCategory === 'Tất cả' ? undefined : selectedCategory);
        await refreshAll();
        showToast(`✓ Đã ${actionLabel.toLowerCase()} cho ${categoryLabel}!`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // 3. Toggle single option / topping
  const handleToggleOption = async (opt: GlobalOptionItem) => {
    const nextState = !opt.isAvailable;
    try {
      await storeService.toggleOptionAvailability(opt.id, nextState);
      await refreshAll();
      showToast(
        nextState
          ? `🟢 Topping "${opt.name}" đã CÒN HÀNG trở lại!`
          : `🔴 Đã BÁO HẾT TOPPING "${opt.name}" (Khóa tùy chọn trên tất cả món)!`
      );
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Batch toggle options
  const handleBatchToggleOptions = async (isAvailable: boolean) => {
    const groupLabel = selectedGroup === 'Tất cả' ? 'tất cả topping & tùy chọn' : `nhóm "${selectedGroup}"`;
    const actionLabel = isAvailable ? 'BẬT CÒN HÀNG' : 'BÁO HẾT TOÀN BỘ';

    if (window.confirm(`Bạn có chắc muốn ${actionLabel} cho ${groupLabel} không?`)) {
      try {
        if (selectedGroup === 'Tất cả') {
          for (const o of optionsList) {
            await storeService.toggleOptionAvailability(o.id, isAvailable);
          }
        } else {
          const found = optionsList.find((o) => o.groupName === selectedGroup);
          if (found) {
            await storeService.toggleOptionGroupAvailability(found.groupId, isAvailable);
          }
        }
        await refreshAll();
        showToast(`✓ Đã ${actionLabel.toLowerCase()} cho ${groupLabel}!`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // 5. Toggle whole shop open / pause status
  const handleToggleShopStatus = async () => {
    const nextStatus = !shopConfig.isOpen;
    try {
      if (!nextStatus) {
        // Tạm nghỉ
        const updated = await storeService.toggleShopOpenStatus(false, pauseReasonInput.trim());
        setShopConfig(updated);
        showToast('⏸️ Tiệm đã chuyển sang trạng thái: TẠM NGHỈ BÁN HÔM NAY!');
      } else {
        // Mở lại
        const updated = await storeService.toggleShopOpenStatus(true, '');
        setShopConfig(updated);
        showToast('🎉 Tiệm đã MỞ BÁN NHẬN ĐƠN trở lại bình thường!');
      }
      await refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePauseReason = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await storeService.updateShopConfig({ pauseReason: pauseReasonInput.trim() });
      setShopConfig(updated);
      setIsEditingReason(false);
      showToast('✓ Đã cập nhật lý do tạm nghỉ cho khách hàng!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-950 text-amber-300 px-4 py-3 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-2.5 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: TITLE & OPERATIONAL STATUS */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-200 mb-2">
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>Kiểm Soát Tồn Kho & Báo Hết Tức Thời</span>
            </div>
            <h1 className="font-serif font-black text-xl sm:text-2xl text-stone-900">
              Quản Lý Bật / Tắt Món & Topping
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl">
              Khi hết nguyên liệu hoặc muốn tạm ngưng món/topping nào, gạt tắt tại đây để khách không thể đặt nhầm món. Có thể kích hoạt lại bán bất cứ lúc nào!
            </p>
          </div>

          {/* CÔNG TẮC TRẠNG THÁI TOÀN CỬA HÀNG (OPEN / PAUSE) */}
          <div
            className={`p-4 rounded-3xl border transition-all flex flex-col justify-between shrink-0 min-w-[280px] sm:min-w-[320px] ${
              shopConfig.isOpen
                ? 'bg-emerald-50/80 border-emerald-300/80'
                : 'bg-rose-50/90 border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 block">
                  Trạng Thái Tiệm Hôm Nay
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="relative flex h-2.5 w-2.5">
                    {shopConfig.isOpen ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    )}
                  </span>
                  <span
                    className={`font-serif font-black text-sm sm:text-base ${
                      shopConfig.isOpen ? 'text-emerald-900' : 'text-rose-900'
                    }`}
                  >
                    {shopConfig.isOpen ? 'Đang Mở Bán Nhận Đơn' : 'TẠM NGHỈ BÁN HÔM NAY'}
                  </span>
                </div>
              </div>

              {/* Huge Shop Toggle Button */}
              <button
                type="button"
                onClick={handleToggleShopStatus}
                className={`py-2 px-3.5 rounded-2xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
                  shopConfig.isOpen
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{shopConfig.isOpen ? 'Bấm Tạm Nghỉ' : 'Mở Bán Lại'}</span>
              </button>
            </div>

            {/* If paused, show reason editor */}
            {!shopConfig.isOpen && (
              <div className="mt-3 pt-3 border-t border-rose-200/80 text-xs">
                {isEditingReason ? (
                  <form onSubmit={handleSavePauseReason} className="space-y-2">
                    <label className="text-[11px] font-bold text-rose-900 block">
                      Lý do hiển thị cho khách:
                    </label>
                    <input
                      type="text"
                      value={pauseReasonInput}
                      onChange={(e) => setPauseReasonInput(e.target.value)}
                      placeholder="VD: Tiệm sửa quầy, hẹn gặp lại bạn ngày mai..."
                      className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-rose-500"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        Lưu Lý Do
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingReason(false)}
                        className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-[11px] font-medium cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-2 text-rose-800">
                    <span className="line-clamp-1 italic">
                      "{shopConfig.pauseReason || 'Hôm nay tiệm tạm ngưng nhận đơn online.'}"
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingReason(true)}
                      className="text-[11px] font-bold underline hover:text-rose-950 shrink-0 cursor-pointer"
                    >
                      Sửa lý do
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* QUICK STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Active products */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-800 font-bold block">Món Đang Bán</span>
              <strong className="text-xl sm:text-2xl font-mono font-black text-emerald-900">
                {activeProductsCount}
              </strong>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-800 flex items-center justify-center font-bold">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Out of stock products */}
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-rose-800 font-bold block">Món ĐÃ BÁO HẾT</span>
              <strong className="text-xl sm:text-2xl font-mono font-black text-rose-900">
                {outOfStockProductsCount}
              </strong>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-800 flex items-center justify-center font-bold">
              <PackageX className="w-5 h-5" />
            </div>
          </div>

          {/* Available toppings */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-800 font-bold block">Topping Còn Hàng</span>
              <strong className="text-xl sm:text-2xl font-mono font-black text-amber-900">
                {availableToppingsCount}
              </strong>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          {/* Out of stock toppings */}
          <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-purple-800 font-bold block">Topping BÁO HẾT</span>
              <strong className="text-xl sm:text-2xl font-mono font-black text-purple-900">
                {outOfStockToppingsCount}
              </strong>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-800 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* TABS SWITCHER: MÓN ĂN vs TOPPING */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 py-3 px-5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 font-black'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Báo Hết Món Ăn & Thức Uống</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'products' ? 'bg-amber-800 text-amber-200' : 'bg-stone-100 text-stone-700'
            }`}
          >
            {products.length} món
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('toppings')}
          className={`flex items-center gap-2 py-3 px-5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'toppings'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 font-black'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>Báo Hết Topping & Tùy Chọn</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'toppings' ? 'bg-amber-800 text-amber-200' : 'bg-stone-100 text-stone-700'
            }`}
          >
            {optionsList.length} tùy chọn
          </span>
        </button>
      </div>

      {/* ================= TAB 1: BÁO HẾT THEO MÓN ĂN ================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-extrabold text-stone-900 text-base sm:text-lg">
                  Danh Sách Món & Tình Trạng Bán Hàng
                </h3>
                <p className="text-xs text-stone-500">
                  Bấm công tắc để chuyển trạng thái tức thì. Khi báo hết, món sẽ bị vô hiệu hóa ngoài Menu.
                </p>
              </div>

              {/* Batch Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleBatchToggleProducts(false)}
                  className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Báo Hết Toàn Bộ
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchToggleProducts(true)}
                  className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Bật Bán Lại Tất Cả
                </button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-stone-100">
              {/* Search */}
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm món bánh, trà sữa, cà phê..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                />
              </div>

              {/* Category */}
              <div className="sm:col-span-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-amber-600"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      Danh mục: {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="sm:col-span-3">
                <select
                  value={productStatusFilter}
                  onChange={(e) => setProductStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-amber-600"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Chỉ món đang bán ({activeProductsCount})</option>
                  <option value="OUT_OF_STOCK">Chỉ món ĐÃ BÁO HẾT ({outOfStockProductsCount})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-stone-200 text-center text-xs text-stone-400">
              Không tìm thấy món ăn nào phù hợp với bộ lọc.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredProducts.map((p) => {
                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-3xl p-4 border transition-all flex flex-col justify-between relative shadow-2xs ${
                      p.isActive
                        ? 'border-emerald-300/80 hover:border-emerald-500 hover:shadow-md'
                        : 'border-rose-300/80 bg-stone-50/80 opacity-90'
                    }`}
                  >
                    <div>
                      {/* Top Header: Image & Info */}
                      <div className="flex items-start gap-3">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className={`w-full h-full object-cover transition-opacity ${
                              !p.isActive ? 'grayscale contrast-125 opacity-70' : ''
                            }`}
                          />
                          {!p.isActive && (
                            <div className="absolute inset-0 bg-stone-950/40 flex items-center justify-center">
                              <span className="text-[9px] font-black text-rose-300 uppercase tracking-tighter bg-stone-900/90 px-1 py-0.5 rounded">
                                HẾT
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                              {p.category}
                            </span>
                            {p.tag && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                {p.tag}
                              </span>
                            )}
                          </div>

                          <h4 className="font-serif font-bold text-stone-900 text-sm mt-1 truncate">
                            {p.name}
                          </h4>

                          <div className="font-mono font-black text-stone-900 text-xs sm:text-sm mt-0.5">
                            {formatCurrency(p.price)}
                            <span className="text-[10px] text-stone-400 font-normal">/{p.unit}</span>
                          </div>
                        </div>
                      </div>

                      {/* Options preview */}
                      {p.optionGroups && p.optionGroups.length > 0 && (
                        <div className="mt-2 text-[11px] text-stone-500 bg-stone-50 p-2 rounded-xl border border-stone-200/60">
                          <span className="font-semibold text-stone-700">Tùy chọn: </span>
                          <span>
                            {p.optionGroups.map((g) => g.name).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Prominent Stock Toggle Switch */}
                    <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            p.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                          }`}
                        />
                        <span
                          className={`text-xs font-black ${
                            p.isActive ? 'text-emerald-800' : 'text-rose-800'
                          }`}
                        >
                          {p.isActive ? 'ĐANG BÁN (Còn hàng)' : '🔴 ĐÃ HẾT MÓN'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleProduct(p)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 ${
                          p.isActive
                            ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                        }`}
                      >
                        {p.isActive ? 'Báo Hết Món' : 'Kích Hoạt Lại'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: BÁO HẾT THEO TOPPING & TÙY CHỌN ================= */}
      {activeTab === 'toppings' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-extrabold text-stone-900 text-base sm:text-lg">
                  Danh Sách Topping & Tùy Chọn Món
                </h3>
                <p className="text-xs text-stone-500">
                  Khi hết trân châu, kem phô mai hoặc một size ly cụ thể, gạt tắt để khách không thể chọn khi đặt món.
                </p>
              </div>

              {/* Batch Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleBatchToggleOptions(false)}
                  className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Báo Hết Toàn Bộ
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchToggleOptions(true)}
                  className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Bật Còn Hàng Tất Cả
                </button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-stone-100">
              {/* Search */}
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm trân châu, phô mai, size L, nướng giòn..."
                  value={toppingSearch}
                  onChange={(e) => setToppingSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                />
              </div>

              {/* Group */}
              <div className="sm:col-span-4">
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-amber-600"
                >
                  {optionGroups.map((grp) => (
                    <option key={grp} value={grp}>
                      Nhóm: {grp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="sm:col-span-3">
                <select
                  value={toppingStatusFilter}
                  onChange={(e) => setToppingStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-amber-600"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="AVAILABLE">Chỉ topping còn hàng ({availableToppingsCount})</option>
                  <option value="OUT_OF_STOCK">Chỉ topping BÁO HẾT ({outOfStockToppingsCount})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Toppings Grid */}
          {filteredToppings.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-stone-200 text-center text-xs text-stone-400">
              Không tìm thấy topping hoặc tùy chọn nào phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredToppings.map((opt) => {
                return (
                  <div
                    key={opt.id}
                    className={`bg-white rounded-3xl p-4 border transition-all flex flex-col justify-between shadow-2xs ${
                      opt.isAvailable
                        ? 'border-emerald-300/80 hover:border-emerald-500 hover:shadow-md'
                        : 'border-rose-300/80 bg-stone-50/80 opacity-90'
                    }`}
                  >
                    <div>
                      {/* Top badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                          {opt.groupName}
                        </span>

                        <span className="text-[10px] font-semibold text-stone-500">
                          {opt.affectedProductsCount} món áp dụng
                        </span>
                      </div>

                      {/* Name & Extra Price */}
                      <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base">
                        {opt.name}
                      </h4>

                      <div className="text-xs font-mono font-bold text-amber-700 mt-1">
                        {opt.price > 0 ? `+${formatCurrency(opt.price)}` : 'Miễn phí'}
                      </div>
                    </div>

                    {/* Stock Toggle Switch */}
                    <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            opt.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                          }`}
                        />
                        <span
                          className={`text-xs font-black ${
                            opt.isAvailable ? 'text-emerald-800' : 'text-rose-800'
                          }`}
                        >
                          {opt.isAvailable ? 'CÒN HÀNG' : '🔴 HẾT TOPPING'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleOption(opt)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 ${
                          opt.isAvailable
                            ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                        }`}
                      >
                        {opt.isAvailable ? 'Báo Hết' : 'Bật Còn Lại'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
