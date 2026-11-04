import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  Award,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  X,
  CheckCircle2,
} from 'lucide-react';
import { storeService, TIER_CONFIG } from '../../services/storeService';
import type { AdminRole, Customer, MemberTier, PointTransaction } from '../../types';
import { formatCurrency, formatDate, formatPhone } from '../../utils/format';
import { Pagination } from '../common/Pagination';

interface CustomerManagerProps {
  userRole?: AdminRole;
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({ userRole = 'owner' }) => {
  const isCashier = userRole === 'cashier';
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | MemberTier>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [customerTransactions, setCustomerTransactions] = useState<PointTransaction[]>([]);
  const [selectedCustomerForAdjust, setSelectedCustomerForAdjust] = useState<Customer | null>(null);
  const [pointsDeltaInput, setPointsDeltaInput] = useState<number>(50);
  const [adjustNoteInput, setAdjustNoteInput] = useState<string>('Thưởng điểm tri ân khách hàng');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Lắng nghe realtime khi có đơn mới tạo khách hoặc cập nhật điểm
  useEffect(() => {
    let isMounted = true;
    const loadCustomers = async () => {
      try {
        const list = await storeService.getCustomers();
        if (isMounted) setCustomers(list);
      } catch (err) {
        console.error('Failed to load customers:', err);
      }
    };
    loadCustomers();

    window.addEventListener('bake_sip_customer_updated', loadCustomers);
    window.addEventListener('bake_sip_order_updated', loadCustomers);
    return () => {
      isMounted = false;
      window.removeEventListener('bake_sip_customer_updated', loadCustomers);
      window.removeEventListener('bake_sip_order_updated', loadCustomers);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Metrics
  const totalPointsInCirculation = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.availablePoints, 0);
  }, [customers]);

  const vipCount = useMemo(() => {
    return customers.filter((c) => c.tier === 'GOLD' || c.tier === 'DIAMOND').length;
  }, [customers]);

  // Lọc danh sách
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchTier = tierFilter === 'ALL' || c.tier === tierFilter;
      const cleanPhone = c.phone.replace(/\D/g, '');
      const cleanQuery = searchQuery.trim().replace(/\D/g, '');
      const matchSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cleanQuery && cleanPhone.includes(cleanQuery));
      return matchTier && matchSearch;
    });
  }, [customers, tierFilter, searchQuery]);

  // Phân trang mượt mà danh sách khách hàng
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(startIndex, startIndex + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // Mở modal lịch sử điểm
  const handleOpenHistory = async (c: Customer) => {
    setSelectedCustomerForHistory(c);
    try {
      const txs = await storeService.getTransactions(c.id);
      setCustomerTransactions(txs);
    } catch {
      setCustomerTransactions([]);
    }
  };

  // Mở modal điều chỉnh điểm
  const handleOpenAdjust = (c: Customer) => {
    if (isCashier) return;
    setSelectedCustomerForAdjust(c);
    setPointsDeltaInput(50);
    setAdjustNoteInput('Thưởng điểm tri ân khách hàng thân thiết');
  };

  // Xác nhận điều chỉnh điểm
  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForAdjust) return;

    try {
      const updated = await storeService.adjustCustomerPoints(
        selectedCustomerForAdjust.id,
        pointsDeltaInput,
        adjustNoteInput.trim()
      );
      const list = await storeService.getCustomers();
      setCustomers(list);
      setSelectedCustomerForAdjust(null);
      showToast(
        `Đã ${pointsDeltaInput >= 0 ? 'cộng' : 'trừ'} ${Math.abs(pointsDeltaInput)} điểm cho khách hàng ${updated.name}!`
      );
    } catch (err: unknown) {
      console.error(err);
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

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 font-medium block">Tổng Số Hội Viên</span>
            <strong className="text-xl font-mono font-black text-stone-900">
              {customers.length} khách
            </strong>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 font-medium block">Hội Viên Vàng & VIP Kim Cương</span>
            <strong className="text-xl font-mono font-black text-purple-700">
              {vipCount} khách hàng
            </strong>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 font-medium block">Tổng Điểm Đang Lưu Hành</span>
            <strong className="text-xl font-mono font-black text-amber-800">
              {totalPointsInCirculation.toLocaleString('vi-VN')} điểm
            </strong>
          </div>
        </div>
      </div>

      {/* TOOLBAR: SEARCH & FILTERS */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif font-extrabold text-stone-900 text-lg sm:text-xl">
              Quản Lý Khách Hàng & Hội Viên (CRM)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Theo dõi phân hạng thẻ, số dư điểm thưởng và lịch sử mua sắm của khách hàng
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-stone-100">
          <div className="sm:col-span-7 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc số điện thoại khách hàng..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:bg-white"
            />
          </div>

          <div className="sm:col-span-5">
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-amber-600"
            >
              <option value="ALL">Tất cả phân hạng thẻ ({customers.length})</option>
              <option value="MEMBER">Thành Viên Mới</option>
              <option value="SILVER">Hội Viên Bạc</option>
              <option value="GOLD">Hội Viên Vàng</option>
              <option value="DIAMOND">VIP Kim Cương</option>
            </select>
          </div>
        </div>
      </div>

      {/* BẢNG KHÁCH HÀNG */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs">
            Không tìm thấy khách hàng nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 pl-5">Khách Hàng</th>
                  <th className="p-3.5">Hạng Thẻ</th>
                  <th className="p-3.5">Tổng Chi Tiêu</th>
                  <th className="p-3.5">Điểm Khả Dụng</th>
                  <th className="p-3.5">Ngày Tham Gia</th>
                  <th className="p-3.5 pr-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {paginatedCustomers.map((c) => {
                  const tierInfo = TIER_CONFIG[c.tier];
                  return (
                    <tr key={c.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="font-bold text-stone-900 text-sm">{c.name}</div>
                        <span className="font-mono text-stone-500 text-xs">{formatPhone(c.phone)}</span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${tierInfo.badgeColor}`}
                        >
                          <Sparkles className="w-3 h-3" />
                          {tierInfo.label}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-stone-900">
                        {formatCurrency(c.totalSpent)}
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono font-black text-amber-800 text-sm block">
                          {c.availablePoints} điểm
                        </span>
                        <span className="text-[10px] text-stone-400">
                          (= {formatCurrency(c.availablePoints * 1000)})
                        </span>
                      </td>

                      <td className="p-3.5 text-stone-500 text-[11px]">{c.joinedDate}</td>

                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenHistory(c)}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Sổ Cái Điểm
                          </button>

                          {!isCashier && (
                            <button
                              type="button"
                              onClick={() => handleOpenAdjust(c)}
                              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              +/- Điểm
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang danh sách khách hàng chuẩn CEO */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredCustomers.length / pageSize)}
          totalItems={filteredCustomers.length}
          pageSize={pageSize}
          onPageChange={(p) => {
            setCurrentPage(p);
          }}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          itemLabel="khách hàng"
        />
      </div>

      {/* MODAL LỊCH SỬ BIẾN ĐỘNG ĐIỂM CỦA KHÁCH */}
      {selectedCustomerForHistory && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            onClick={() => setSelectedCustomerForHistory(null)}
            className="fixed inset-0 bg-stone-950/75 backdrop-blur-xs transition-opacity"
          />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-3xl border border-stone-200 shadow-2xl p-5 space-y-4 animate-fade-in my-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-base">
                    Sổ Cái Điểm: {selectedCustomerForHistory.name}
                  </h4>
                  <span className="text-xs text-stone-500 font-mono">
                    {formatPhone(selectedCustomerForHistory.phone)} &bull; Hiện có:{' '}
                    <strong className="text-amber-800">{selectedCustomerForHistory.availablePoints} điểm</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCustomerForHistory(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Transactions List */}
              <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto border border-stone-100 rounded-2xl p-1 bg-stone-50/50">
                {customerTransactions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-400">
                    Chưa có giao dịch tích/tiêu điểm nào.
                  </div>
                ) : (
                  customerTransactions.map((tx) => {
                    const isPositive = tx.points > 0;
                    return (
                      <div key={tx.id} className="p-3 flex items-center justify-between text-xs bg-white rounded-xl mb-1 border border-stone-100">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                              isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900">{tx.note}</div>
                            <span className="text-[10px] text-stone-400">{formatDate(tx.createdAt)}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`font-mono font-bold text-xs ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {isPositive ? `+${tx.points}` : tx.points} điểm
                          </span>
                          <span className="text-[10px] text-stone-400 block">Dư: {tx.balanceAfter}đ</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomerForHistory(null)}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐIỀU CHỈNH ĐIỂM THỦ CÔNG */}
      {selectedCustomerForAdjust && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            onClick={() => setSelectedCustomerForAdjust(null)}
            className="fixed inset-0 bg-stone-950/75 backdrop-blur-xs transition-opacity"
          />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl p-5 space-y-4 animate-fade-in my-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-base">
                    Điều Chỉnh Điểm Thưởng
                  </h4>
                  <span className="text-xs text-stone-500">
                    Khách: <strong>{selectedCustomerForAdjust.name}</strong> ({selectedCustomerForAdjust.phone})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCustomerForAdjust(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmAdjust} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">
                    Số điểm thay đổi (Dương: Cộng thêm, Âm: Trừ bớt)
                  </label>
                  <input
                    type="number"
                    value={pointsDeltaInput}
                    onChange={(e) => setPointsDeltaInput(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900"
                    required
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPointsDeltaInput(50)}
                      className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold"
                    >
                      +50 điểm
                    </button>
                    <button
                      type="button"
                      onClick={() => setPointsDeltaInput(100)}
                      className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold"
                    >
                      +100 điểm
                    </button>
                    <button
                      type="button"
                      onClick={() => setPointsDeltaInput(-50)}
                      className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold"
                    >
                      -50 điểm
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Lý do điều chỉnh</label>
                  <input
                    type="text"
                    value={adjustNoteInput}
                    onChange={(e) => setAdjustNoteInput(e.target.value)}
                    placeholder="VD: Thưởng sinh nhật, Bù điểm sự cố..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900"
                    required
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerForAdjust(null)}
                    className="flex-1 py-2.5 border border-stone-300 rounded-xl font-semibold text-stone-700"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-stone-900 text-amber-300 rounded-xl font-bold shadow-md cursor-pointer hover:bg-stone-800"
                  >
                    Xác Nhận Lưu
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
