import { useState, useEffect } from 'react';
import type { Voucher } from '../../types';
import { storeService } from '../../services/storeService';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { Pagination } from '../common/Pagination';
import { getDiff, hasChanges, isVersionMismatchError } from '../../utils/diff';

export function VoucherManager() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(30000);
  const [minOrderValue, setMinOrderValue] = useState<number>(80000);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [isActive, setIsActive] = useState(true);

  const loadData = async () => {
    try {
      const list = await storeService.getVouchers();
      setVouchers(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const handleVoucherUpdate = () => {
      loadData();
    };
    window.addEventListener('bake_sip_voucher_updated', handleVoucherUpdate);
    return () => {
      window.removeEventListener('bake_sip_voucher_updated', handleVoucherUpdate);
    };
  }, []);

  const openAddModal = () => {
    setEditingVoucher(null);
    setCode('');
    setTitle('');
    setDiscountType('percent');
    setDiscountValue(10);
    setMaxDiscountAmount(30000);
    setMinOrderValue(80000);

    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(now.getMonth() + 1);

    const formatForInput = (d: Date) => d.toISOString().slice(0, 16);
    setStartDate(formatForInput(now));
    setEndDate(formatForInput(oneMonthLater));
    setUsageLimit(200);
    setIsActive(true);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (v: Voucher) => {
    setEditingVoucher(v);
    setCode(v.code);
    setTitle(v.title);
    setDiscountType(v.discountType);
    setDiscountValue(v.discountValue);
    setMaxDiscountAmount(v.maxDiscountAmount || 0);
    setMinOrderValue(v.minOrderValue || 0);
    setStartDate(v.startDate ? v.startDate.slice(0, 16) : '');
    setEndDate(v.endDate ? v.endDate.slice(0, 16) : '');
    setUsageLimit(v.usageLimit || 0);
    setIsActive(v.isActive);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!code.trim()) {
      setErrorMessage('Vui lòng nhập mã giảm giá (Code)');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tiêu đề mô tả mã giảm giá');
      return;
    }
    if (discountType === 'percent' && (discountValue <= 0 || discountValue > 100)) {
      setErrorMessage('Phần trăm giảm giá phải từ 1% đến 100%');
      return;
    }
    if (discountType === 'fixed' && discountValue <= 0) {
      setErrorMessage('Số tiền giảm cố định phải lớn hơn 0đ');
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      title: title.trim(),
      discountType,
      discountValue: Number(discountValue),
      maxDiscountAmount: discountType === 'percent' ? Number(maxDiscountAmount) || undefined : undefined,
      minOrderValue: Number(minOrderValue) || 0,
      startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
      usageLimit: Number(usageLimit) || undefined,
      isActive,
    };

    try {
      if (editingVoucher) {
        // Chỉ gửi các trường thực sự thay đổi + version (Partial Update & OCC)
        const diff = getDiff(editingVoucher, payload);
        if (!hasChanges(diff)) {
          setErrorMessage('Bạn chưa thay đổi thông tin nào của mã khuyến mãi.');
          return;
        }

        await storeService.updateVoucher(editingVoucher.id, diff);
      } else {
        await storeService.addVoucher(payload);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      if (isVersionMismatchError(err)) {
        setErrorMessage(
          '⚠️ Mã khuyến mãi vừa được cập nhật từ thiết bị khác! Hệ thống đang tải lại dữ liệu mới nhất...'
        );
        await loadData();
        if (editingVoucher) {
          const freshList = await storeService.getVouchers(true);
          const fresh = freshList.find((v) => v.id === editingVoucher.id);
          if (fresh) {
            openEditModal(fresh);
          }
        }
      } else {
        setErrorMessage(err.message || 'Lỗi khi lưu mã khuyến mãi');
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await storeService.toggleVoucherStatus(id);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string, codeName: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${codeName}"?`)) {
      try {
        await storeService.deleteVoucher(id);
        await loadData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const getVoucherStatusBadge = (v: Voucher) => {
    if (!v.isActive) {
      return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold text-[10px]">Tạm Khóa</span>;
    }
    const now = new Date();
    if (v.startDate && now < new Date(v.startDate)) {
      return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold text-[10px]">Sắp Diễn Ra</span>;
    }
    if (v.endDate && now > new Date(v.endDate)) {
      return <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold text-[10px]">Hết Hạn</span>;
    }
    if (v.usageLimit && v.usedCount >= v.usageLimit) {
      return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold text-[10px]">Hết Lượt</span>;
    }
    return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">Đang Hiệu Lực</span>;
  };

  const filteredVouchers = vouchers.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return v.code.toLowerCase().includes(q) || v.title.toLowerCase().includes(q);
  });

  const paginatedVouchers = filteredVouchers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>🎟️</span> Quản Lý Mã Khuyến Mãi & Voucher
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập mã giảm giá theo %, giảm tiền trực tiếp, đơn hàng tối thiểu và thời gian hiệu lực
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <span>➕</span> Tạo Mã Khuyến Mãi Mới
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm theo mã voucher hoặc tên khuyến mãi..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:bg-white transition-colors"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Tìm thấy <strong className="text-amber-600 font-mono">{filteredVouchers.length}</strong> mã khuyến mãi
        </div>
      </div>

      {/* Grid danh sách vouchers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedVouchers.map((v) => {
          const percentUsed = v.usageLimit ? Math.min(100, Math.round((v.usedCount / v.usageLimit) * 100)) : null;

          return (
            <div
              key={v.id}
              className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-sm relative overflow-hidden ${
                v.isActive ? 'border-slate-200 hover:border-amber-400 hover:shadow-md' : 'border-slate-200 opacity-60 bg-slate-50/50'
              }`}
            >
              {/* Top Bar */}
              <div>
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                      {v.code}
                    </span>
                    {getVoucherStatusBadge(v)}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(v)}
                      title="Chỉnh sửa"
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(v.id, v.code)}
                      title="Xóa voucher"
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center text-xs"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="py-3 space-y-2">
                  <h4 className="font-bold text-slate-800 text-sm leading-snug">{v.title}</h4>

                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-900">
                      {v.discountType === 'percent' ? `Giảm ${v.discountValue}%` : `Giảm ${formatCurrency(v.discountValue)}`}
                    </span>
                    {v.discountType === 'percent' && v.maxDiscountAmount && (
                      <span className="text-xs text-slate-500 font-medium">
                        (Tối đa {formatCurrency(v.maxDiscountAmount)})
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">📦 Đơn tối thiểu:</span>
                      <strong className="text-slate-700">{v.minOrderValue ? formatCurrency(v.minOrderValue) : 'Không giới hạn'}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">⏳ Thời gian:</span>
                      <span className="text-[11px] text-slate-600">
                        {v.endDate ? `Đến ${formatDateTime(v.endDate)}` : 'Vô thời hạn'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Usage & Toggle */}
              <div className="pt-3 border-t border-slate-100 mt-2">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-500">
                    Đã dùng: <strong className="text-slate-800">{v.usedCount}</strong>
                    {v.usageLimit ? ` / ${v.usageLimit} lượt` : ' lượt (Không giới hạn)'}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(v.id)}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors ${
                      v.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {v.isActive ? 'Tạm dừng' : 'Kích hoạt lại'}
                  </button>
                </div>

                {percentUsed !== null && (
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        percentUsed >= 100 ? 'bg-rose-500' : percentUsed >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percentUsed}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Phân trang danh sách voucher chuẩn CEO */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredVouchers.length / pageSize)}
        totalItems={filteredVouchers.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
        pageSizeOptions={[6, 9, 15, 30]}
        itemLabel="mã voucher"
        className="rounded-2xl border border-slate-200"
      />

      {/* Modal Thêm / Chỉnh Sửa Voucher */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>🎟️</span> {editingVoucher ? 'Chỉnh Sửa Mã Khuyến Mãi' : 'Tạo Mã Khuyến Mãi Mới'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Hệ thống sẽ tự động tính toán và đối soát an toàn tại Backend, bảo mật doanh thu quán
            </p>

            {errorMessage && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="VD: BANHNGON20"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loại giảm giá</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả / Tiêu đề khuyến mãi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Giảm 10% Tối Đa 30k Cho Đơn Từ 80k"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {discountType === 'percent' ? 'Mức giảm (%)' : 'Số tiền giảm (VNĐ)'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={discountType === 'percent' ? 100 : undefined}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {discountType === 'percent' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Giảm tối đa (VNĐ)</label>
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      value={maxDiscountAmount}
                      onChange={(e) => setMaxDiscountAmount(Number(e.target.value))}
                      placeholder="VD: 30000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Số lượt giới hạn</label>
                    <input
                      type="number"
                      min="0"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(Number(e.target.value))}
                      placeholder="0 = Không giới hạn"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Đơn hàng tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    step="5000"
                    min="0"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    placeholder="VD: 80000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {discountType === 'percent' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Số lượt giới hạn</label>
                    <input
                      type="number"
                      min="0"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(Number(e.target.value))}
                      placeholder="0 = Không giới hạn"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày giờ bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày giờ kết thúc</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Kích hoạt mã giảm giá này ngay lập tức
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-md shadow-amber-500/20"
                >
                  {editingVoucher ? 'Lưu Thay Đổi' : 'Tạo Mã Giảm Giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
