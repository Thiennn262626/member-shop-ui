import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Package,
  CheckCircle2,
  XCircle,
  Tag,
  Sparkles,
  Layers,
  Image as ImageIcon,
  DollarSign,
  Croissant,
  X,
  AlertCircle,
  Gift,
} from 'lucide-react';
import { storeService, OPTION_PRESETS } from '../../services/storeService';
import { useShopStore } from '../../stores/useShopStore';
import type { AdminRole, ItemOptionGroup, Product } from '../../types';
import { formatCurrency } from '../../utils/format';

// Kho ảnh mẫu F&B chất lượng cao của tiệm bánh & đồ uống
const SAMPLE_IMAGE_LIBRARY = [
  {
    name: 'Bánh Croissant Bơ Pháp',
    category: 'Bánh Nướng Nóng',
    url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Bánh Mì Bơ Tỏi Phô Mai',
    category: 'Bánh Mì & Mặn',
    url: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Bánh Mì Chà Bông Phô Mai Cay',
    category: 'Bánh Mì & Mặn',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Bánh Kem Tiramisu Cacao',
    category: 'Bánh Ngọt & Kem',
    url: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Bánh Su Kem Craquelin Vani',
    category: 'Bánh Ngọt & Kem',
    url: 'https://images.unsplash.com/photo-1612203985729-70726954388c?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Bánh Danish Dâu Tây Tươi',
    category: 'Bánh Nướng Nóng',
    url: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Trà Đào Cam Sả Hoàng Kim',
    category: 'Trà & Trà Sữa',
    url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Trà Sữa Ô Long Nướng Trân Châu',
    category: 'Trà & Trà Sữa',
    url: 'https://images.unsplash.com/photo-1558857563-b37d10b06b7a?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cà Phê Muối Xứ Huế',
    category: 'Cà Phê & Đá Xay',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Bạc Xỉu Kem Sữa Hạnh Nhân',
    category: 'Cà Phê & Đá Xay',
    url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&auto=format&fit=crop&q=80',
  },
];

const CATEGORIES: Product['category'][] = [
  'Bánh Mì & Mặn',
  'Bánh Ngọt & Kem',
  'Bánh Nướng Nóng',
  'Trà & Trà Sữa',
  'Cà Phê & Đá Xay',
];

const PRODUCT_TAGS: NonNullable<Product['tag']>[] = [
  'Signature ⭐',
  'Bán Chạy 🔥',
  'Mới Ra Lò 🥐',
  'Giảm Giá ⚡',
];

interface ProductManagerProps {
  userRole?: AdminRole;
}

export const ProductManager: React.FC<ProductManagerProps> = ({ userRole = 'owner' }) => {
  const isCashier = userRole === 'cashier';
  const products = useShopStore((state) => state.products);
  const setProducts = useShopStore((state) => state.setProducts);
  const shopConfig = useShopStore((state) => state.shopConfig);
  const fetchProducts = useShopStore((state) => state.fetchProducts);
  const fetchShopConfig = useShopStore((state) => state.fetchShopConfig);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Tất cả');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<Product['category']>('Bánh Nướng Nóng');
  const [formPrice, setFormPrice] = useState<number>(35000);
  const [formFakePrice, setFormFakePrice] = useState<number | ''>('');
  const [formUnit, setFormUnit] = useState('cái');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formTag, setFormTag] = useState<Product['tag'] | ''>('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formAllowPointRedemption, setFormAllowPointRedemption] = useState(true);
  const [formPointsRequiredToRedeem, setFormPointsRequiredToRedeem] = useState<number>(35);
  const [formOptionGroups, setFormOptionGroups] = useState<ItemOptionGroup[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Lắng nghe cập nhật sản phẩm Realtime qua Zustand store
  useEffect(() => {
    fetchProducts();
    fetchShopConfig();

    const handleProductUpdate = () => {
      fetchProducts(true);
    };

    window.addEventListener('bake_sip_product_updated', handleProductUpdate);
    return () => {
      window.removeEventListener('bake_sip_product_updated', handleProductUpdate);
    };
  }, [fetchProducts, fetchShopConfig]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Metrics
  const activeCount = useMemo(() => products.filter((p) => p.isActive).length, [products]);
  const inactiveCount = useMemo(() => products.filter((p) => !p.isActive).length, [products]);
  const signatureCount = useMemo(() => products.filter((p) => p.tag === 'Signature ⭐' || p.tag === 'Bán Chạy 🔥').length, [products]);

  // Lọc sản phẩm
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = categoryFilter === 'Tất cả' || p.category === categoryFilter;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && p.isActive) ||
        (statusFilter === 'INACTIVE' && !p.isActive);
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchStatus && matchSearch;
    });
  }, [products, categoryFilter, statusFilter, searchQuery]);

  // Mở modal Thêm mới
  const handleOpenAddModal = () => {
    if (isCashier) return;
    const suggestedPoints = Math.max(1, Math.round(35000 / (shopConfig.pointToVndRatio || 1000)));

    setEditingProduct(null);
    setFormName('');
    setFormCategory('Bánh Nướng Nóng');
    setFormPrice(35000);
    setFormFakePrice('');
    setFormUnit('cái');
    setFormDescription('');
    setFormImageUrl(SAMPLE_IMAGE_LIBRARY[0].url);
    setFormTag('');
    setFormIsActive(true);
    setFormAllowPointRedemption(true);
    setFormPointsRequiredToRedeem(suggestedPoints);
    setFormOptionGroups([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Mở modal Chỉnh sửa
  const handleOpenEditModal = (p: Product) => {
    if (isCashier) return;
    const suggestedPoints = Math.max(1, Math.round(p.price / (shopConfig.pointToVndRatio || 1000)));

    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormPrice(p.price);
    setFormFakePrice(p.fakePrice || '');
    setFormUnit(p.unit);
    setFormDescription(p.description);
    setFormImageUrl(p.imageUrl);
    setFormTag(p.tag || '');
    setFormIsActive(p.isActive);
    setFormAllowPointRedemption(p.allowPointRedemption ?? true);
    setFormPointsRequiredToRedeem(p.pointsRequiredToRedeem ?? suggestedPoints);
    setFormOptionGroups(p.optionGroups ? JSON.parse(JSON.stringify(p.optionGroups)) : []);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Lưu sản phẩm (Thêm mới hoặc Cập nhật)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Vui lòng nhập tên món.');
      return;
    }
    if (formPrice <= 0) {
      setFormError('Giá bán phải lớn hơn 0đ.');
      return;
    }
    if (!formImageUrl.trim()) {
      setFormError('Vui lòng chọn hoặc nhập đường dẫn ảnh món.');
      return;
    }

    try {
      const payload = {
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        price: formPrice,
        fakePrice: typeof formFakePrice === 'number' && formFakePrice > formPrice ? formFakePrice : undefined,
        bonusPrice: Math.floor(formPrice / 1000),
        imageUrl: formImageUrl.trim(),
        unit: formUnit.trim() || 'phần',
        tag: (formTag as Product['tag']) || undefined,
        isActive: formIsActive,
        allowPointRedemption: formAllowPointRedemption,
        pointsRequiredToRedeem: formAllowPointRedemption ? Math.max(1, Number(formPointsRequiredToRedeem) || 1) : undefined,
        rating: editingProduct?.rating || 5.0,
        soldCount: editingProduct?.soldCount || 0,
        optionGroups: formOptionGroups.length > 0 ? formOptionGroups : undefined,
      };

      if (editingProduct) {
        await storeService.updateProduct(editingProduct.id, payload);
        showToast(`Đã cập nhật món "${payload.name}" thành công!`);
      } else {
        await storeService.addProduct(payload);
        showToast(`Đã thêm món "${payload.name}" vào thực đơn!`);
      }

      const pList = await storeService.getProducts();
      setProducts(pList);
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu sản phẩm';
      setFormError(msg);
    }
  };

  // Bật/tắt trạng thái Còn hàng / Tạm hết món
  const handleToggleStatus = async (p: Product) => {
    try {
      const updated = await storeService.toggleProductStatus(p.id);
      const pList = await storeService.getProducts();
      setProducts(pList);
      showToast(
        updated.isActive
          ? `Món "${p.name}" đã được bật kinh doanh trở lại!`
          : `Đã tạm ngưng món "${p.name}" (Báo hết hàng)!`
      );
    } catch (err: unknown) {
      console.error(err);
    }
  };

  // Xóa sản phẩm
  const handleDeleteProduct = async (p: Product) => {
    if (isCashier) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa món "${p.name}" khỏi thực đơn không?`)) {
      try {
        await storeService.deleteProduct(p.id);
        const pList = await storeService.getProducts();
        setProducts(pList);
        showToast(`Đã xóa món "${p.name}" thành công.`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Chọn bộ Preset tùy chọn (Size, Topping)
  const handleApplyPreset = (presetId: string) => {
    const found = OPTION_PRESETS.find((pr) => pr.id === presetId);
    if (found) {
      setFormOptionGroups(JSON.parse(JSON.stringify(found.groups)));
      showToast(`Đã áp dụng ${found.label}!`);
    }
  };

  return (
    <div className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-amber-300 px-4 py-3 rounded-2xl shadow-xl border border-stone-700 flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 font-medium block">Tổng Số Món</span>
            <strong className="text-lg sm:text-xl font-mono font-black text-stone-900">
              {products.length} món
            </strong>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 font-medium block">Đang Bán (Active)</span>
            <strong className="text-lg sm:text-xl font-mono font-black text-emerald-700">
              {activeCount} món
            </strong>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 font-medium block">Tạm Hết Món</span>
            <strong className="text-lg sm:text-xl font-mono font-black text-rose-700">
              {inactiveCount} món
            </strong>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 font-medium block">Món Nổi Bật (Tags)</span>
            <strong className="text-lg sm:text-xl font-mono font-black text-purple-700">
              {signatureCount} món
            </strong>
          </div>
        </div>
      </div>

      {/* TOOLBAR: SEARCH, FILTERS & ACTION */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif font-extrabold text-stone-900 text-lg sm:text-xl">
              Danh Mục Sản Phẩm Tiệm Bánh & Nước
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Quản lý giá, danh mục, bật/tắt còn hàng siêu tốc và cấu hình Size & Topping
            </p>
          </div>

          {isCashier ? (
            <div className="px-3.5 py-2 bg-stone-100 border border-stone-200 text-stone-600 rounded-2xl text-xs font-semibold flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Chế độ Thu Ngân (Chỉ bật/tắt còn món)</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/25 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Món Mới</span>
            </button>
          )}
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-stone-100">
          {/* Ô tìm kiếm */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên bánh, trà, cà phê..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:bg-white"
            />
          </div>

          {/* Lọc danh mục */}
          <div className="sm:col-span-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-amber-600"
            >
              <option value="Tất cả">Tất cả danh mục ({products.length})</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({products.filter((p) => p.category === cat).length})
                </option>
              ))}
            </select>
          </div>

          {/* Lọc trạng thái */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-amber-600"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang kinh doanh ({activeCount})</option>
              <option value="INACTIVE">Tạm hết món ({inactiveCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* BẢNG DANH SÁCH MÓN (PRODUCT TABLE) */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-xs space-y-2">
            <Package className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="font-bold text-stone-700">Không tìm thấy món ăn nào</p>
            <p className="text-[11px] text-stone-400">Hãy thử đổi từ khóa tìm kiếm hoặc bỏ lọc danh mục</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 pl-5">Món Ăn & Thức Uống</th>
                  <th className="p-3.5">Danh Mục</th>
                  <th className="p-3.5">Giá Bán</th>
                  <th className="p-3.5">Tùy Chọn (Size / Topping)</th>
                  <th className="p-3.5 text-center">Trạng Thái (Còn / Hết)</th>
                  <th className="p-3.5 pr-5 text-right">{isCashier ? 'Quyền Hạn' : 'Thao Tác'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((p) => {
                  const hasOptions = p.optionGroups && p.optionGroups.length > 0;
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-amber-50/40 transition-colors ${
                        !p.isActive ? 'opacity-65 bg-stone-50/50' : ''
                      }`}
                    >
                      {/* Product Thumbnail & Name */}
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-serif font-bold text-stone-900 text-sm">
                                {p.name}
                              </span>
                              {p.tag && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                                  {p.tag}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-400 line-clamp-1 mt-0.5 max-w-xs">
                              {p.description}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-stone-100 text-stone-700">
                          {p.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-stone-900 text-sm">
                          {formatCurrency(p.price)}
                        </div>
                        {p.fakePrice && p.fakePrice > p.price && (
                          <div className="text-[11px] text-stone-400 line-through font-mono">
                            {formatCurrency(p.fakePrice)}
                          </div>
                        )}
                        <span className="text-[10px] text-stone-400">/{p.unit}</span>
                        {p.allowPointRedemption && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                              <Gift className="w-2.5 h-2.5 text-amber-600" />
                              <span>Đổi: {p.pointsRequiredToRedeem || Math.round(p.price / 1000)} điểm</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Option Groups */}
                      <td className="p-3.5">
                        {hasOptions ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              <Layers className="w-3 h-3" />
                              <span>{p.optionGroups!.length} nhóm tùy chọn</span>
                            </span>
                            <div className="text-[10px] text-stone-500">
                              {p.optionGroups!.map((g) => g.name).join(', ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400 italic">Không có</span>
                        )}
                      </td>

                      {/* Quick Status Toggle (Còn hàng / Tạm hết món) */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            p.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                          }`}
                          title="Bấm để bật/tắt trạng thái còn hàng"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              p.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                            }`}
                          />
                          <span>{p.isActive ? 'Đang bán' : 'Tạm hết món'}</span>
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="p-3.5 pr-5 text-right">
                        {!isCashier ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200 transition-colors cursor-pointer"
                              title="Chỉnh sửa món"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1.5 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-400 hover:text-rose-700 border border-stone-200 transition-colors cursor-pointer"
                              title="Xóa khỏi thực đơn"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400 font-medium italic">Chỉ xem</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL THÊM / SỬA MÓN ĂN & THỨC UỐNG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-stone-950/75 backdrop-blur-xs transition-opacity"
          />

          <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh] animate-fade-in">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                    <Croissant className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-stone-900 text-base">
                      {editingProduct ? `Chỉnh Sửa Món: ${editingProduct.name}` : 'Thêm Món Mới Vào Thực Đơn'}
                    </h3>
                    <span className="text-[11px] text-stone-500">
                      Cập nhật giá, ảnh món và thiết lập nhóm size / topping
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveProduct} className="p-4 sm:p-6 overflow-y-auto space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Tên & Danh mục */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-7 space-y-1">
                    <label className="text-xs font-bold text-stone-700">Tên Món Ăn / Đồ Uống *</label>
                    <input
                      type="text"
                      placeholder="VD: Bánh Croissant Bơ Pháp, Trà Đào Cam Sả..."
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                      required
                    />
                  </div>

                  <div className="sm:col-span-5 space-y-1">
                    <label className="text-xs font-bold text-stone-700">Danh Mục *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as Product['category'])}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Giá bán, Giá gạch & Đơn vị tính */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                      <span>Giá Bán (VNĐ) *</span>
                    </label>
                    <input
                      type="number"
                      step={1000}
                      min={1000}
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-600">Giá Gốc Niêm Yết (Gạch ngang)</label>
                    <input
                      type="number"
                      step={1000}
                      placeholder="VD: 42000"
                      value={formFakePrice}
                      onChange={(e) => setFormFakePrice(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-700 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-600">Đơn Vị Tính</label>
                    <input
                      type="text"
                      placeholder="cái, ly, ổ, phần..."
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Tag Huy Hiệu & Trạng Thái Kinh Doanh */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-amber-600" />
                      <span>Huy Hiệu Tag Nổi Bật</span>
                    </label>
                    <select
                      value={formTag}
                      onChange={(e) => setFormTag(e.target.value as any)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                    >
                      <option value="">Không có huy hiệu</option>
                      {PRODUCT_TAGS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Tình Trạng Hàng</label>
                    <div className="flex items-center gap-3 pt-1.5">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="statusRadio"
                          checked={formIsActive}
                          onChange={() => setFormIsActive(true)}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="font-bold text-emerald-700">Đang Bán (Còn Hàng)</span>
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="statusRadio"
                          checked={!formIsActive}
                          onChange={() => setFormIsActive(false)}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        <span className="font-bold text-rose-700">Tạm Hết Hàng</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Hình ảnh món & Thư viện mẫu */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                      <span>Hình Ảnh Món Ăn *</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowImagePicker(!showImagePicker)}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-900 underline cursor-pointer"
                    >
                      {showImagePicker ? 'Đóng Thư Viện Ảnh' : 'Chọn Từ Kho Ảnh Mẫu Tiệm Bánh'}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Nhập đường link hình ảnh (https://...)"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="flex-1 px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                      required
                    />
                    {formImageUrl && (
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-stone-200 shrink-0">
                        <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Kho ảnh mẫu */}
                  {showImagePicker && (
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                      <span className="text-[11px] font-bold text-stone-600 block">
                        Bấm vào ảnh để áp dụng ngay:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {SAMPLE_IMAGE_LIBRARY.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setFormImageUrl(item.url);
                              if (!formName) setFormName(item.name);
                              setShowImagePicker(false);
                            }}
                            className="group text-left border border-stone-200 hover:border-amber-500 rounded-xl overflow-hidden bg-white p-1 transition-all cursor-pointer"
                          >
                            <img
                              src={item.url}
                              alt={item.name}
                              className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform"
                            />
                            <span className="text-[10px] font-semibold text-stone-700 block truncate mt-1">
                              {item.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mô tả món */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Mô Tả Hương Vị & Thành Phần</label>
                  <textarea
                    rows={2}
                    placeholder="Mô tả hương vị, bơ Pháp giòn tan, trà thơm hoa quả tươi..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white resize-none"
                  />
                </div>

                {/* CẤU HÌNH ĐỔI ĐIỂM THƯỞNG LẤY SẢN PHẨM */}
                <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formAllowPointRedemption}
                        onChange={(e) => setFormAllowPointRedemption(e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <Gift className="w-4 h-4 text-amber-600" />
                        <span>Cho phép khách dùng điểm thưởng để đổi món này (Giá 0đ)</span>
                      </span>
                    </label>
                  </div>

                  {formAllowPointRedemption && (
                    <div className="space-y-2 pt-2 border-t border-amber-200/60">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-stone-700 whitespace-nowrap">
                            Số điểm cần để đổi:
                          </label>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={formPointsRequiredToRedeem}
                            onChange={(e) => setFormPointsRequiredToRedeem(Math.max(1, Number(e.target.value)))}
                            className="w-24 px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <span className="text-xs font-bold text-amber-900">điểm</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const calc = Math.max(1, Math.round(formPrice / (shopConfig.pointToVndRatio || 1000)));
                            setFormPointsRequiredToRedeem(calc);
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl text-[11px] font-semibold text-amber-900 transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
                        >
                          ⚡ Gợi ý theo tỷ lệ tiệm ({Math.max(1, Math.round(formPrice / (shopConfig.pointToVndRatio || 1000)))} điểm)
                        </button>
                      </div>

                      <p className="text-[11px] text-amber-900/80 leading-relaxed">
                        💡 Tỷ lệ hiện tại của tiệm: <strong>1 điểm = {formatCurrency(shopConfig.pointToVndRatio || 1000)}</strong>.
                        Khách tích lũy đủ {formPointsRequiredToRedeem} điểm có thể bấm đổi trực tiếp món này trong giỏ hàng hoặc tại quầy thu ngân.
                      </p>
                    </div>
                  )}
                </div>

                {/* CẤU HÌNH NHÓM TÙY CHỌN (OPTION GROUPS: SIZE, TOPPING) */}
                <div className="border-t border-stone-200 pt-3 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-amber-600" />
                        <span>Nhóm Tùy Chọn Món (Size, Mức Đá, Topping, Hâm Nóng)</span>
                      </h4>
                      <span className="text-[11px] text-stone-500">
                        {formOptionGroups.length === 0
                          ? 'Món này chưa có tùy chọn (khách mua giá cố định)'
                          : `Đang có ${formOptionGroups.length} nhóm tùy chọn`}
                      </span>
                    </div>

                    {/* Nút xóa hết tùy chọn */}
                    {formOptionGroups.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormOptionGroups([])}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        Bỏ hết tùy chọn (Bán giá cố định)
                      </button>
                    )}
                  </div>

                  {/* Chọn nhanh từ bộ Preset F&B */}
                  <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 space-y-2">
                    <span className="text-[11px] font-bold text-amber-900 block">
                      Áp dụng nhanh bộ tùy chọn có sẵn (Presets):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {OPTION_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleApplyPreset(preset.id)}
                          className="px-2.5 py-1 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-stone-800 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hiển thị danh sách nhóm tùy chọn đã cấu hình */}
                  {formOptionGroups.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-stone-200 rounded-2xl p-3 bg-stone-50">
                      {formOptionGroups.map((group, gIdx) => (
                        <div
                          key={gIdx}
                          className="bg-white p-2.5 rounded-xl border border-stone-200 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between font-bold text-stone-900">
                            <span>
                              {gIdx + 1}. {group.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                                {group.required ? 'Bắt buộc' : 'Tùy chọn'} &bull;{' '}
                                {group.selection === 'only' ? 'Chọn 1' : 'Chọn nhiều'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormOptionGroups(formOptionGroups.filter((_, idx) => idx !== gIdx))
                                }
                                className="text-stone-400 hover:text-rose-600 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 pt-1">
                            {group.options.map((opt, oIdx) => (
                              <span
                                key={oIdx}
                                className="text-[10px] bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-md text-stone-700"
                              >
                                {opt.name} {opt.price > 0 && `(+${formatCurrency(opt.price)})`}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form Footer Buttons */}
                <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 border border-stone-300 hover:bg-stone-100 rounded-xl text-xs font-semibold text-stone-700 cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    {editingProduct ? 'Lưu Thay Đổi' : 'Thêm Món Vào Thực Đơn'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
