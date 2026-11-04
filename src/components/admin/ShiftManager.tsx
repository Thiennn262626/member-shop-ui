import { useState, useEffect } from 'react';
import type { CashShift, StaffAccount } from '../../types';
import { storeService } from '../../services/storeService';
import { formatCurrency, formatDateTime } from '../../utils/format';

interface ShiftManagerProps {
  currentStaff: StaffAccount;
}

export function ShiftManager({ currentStaff }: ShiftManagerProps) {
  const [shifts, setShifts] = useState<CashShift[]>([]);
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [selectedShiftForDetail, setSelectedShiftForDetail] = useState<CashShift | null>(null);

  // Modal Open Shift
  const [isOpenShiftModal, setIsOpenShiftModal] = useState(false);
  const [shiftNameInput, setShiftNameInput] = useState('Ca Sáng (06:30 - 14:30)');
  const [initialFloatInput, setInitialFloatInput] = useState(500000);
  const [openNotesInput, setOpenNotesInput] = useState('');

  // Modal Close Shift
  const [isCloseShiftModal, setIsCloseShiftModal] = useState(false);
  const [actualCashInput, setActualCashInput] = useState<number>(0);
  const [nextStaffNameInput, setNextStaffNameInput] = useState('');
  const [closeNotesInput, setCloseNotesInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    try {
      const [all, active] = await Promise.all([
        storeService.getShifts(),
        storeService.getCurrentShift(),
      ]);
      setShifts(all);
      setCurrentShift(active);
      if (active) {
        setActualCashInput(active.expectedCash);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const handleShiftUpdate = () => {
      loadData();
    };
    window.addEventListener('bake_sip_shift_updated', handleShiftUpdate);
    return () => {
      window.removeEventListener('bake_sip_shift_updated', handleShiftUpdate);
    };
  }, []);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await storeService.openShift({
        staffId: currentStaff.id,
        staffName: currentStaff.name,
        staffRole: currentStaff.role,
        shiftName: shiftNameInput,
        initialFloat: Number(initialFloatInput) || 0,
        notes: openNotesInput,
      });
      setIsOpenShiftModal(false);
      setOpenNotesInput('');
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi mở ca làm việc');
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;
    setErrorMessage('');
    try {
      await storeService.closeShift(currentShift.id, {
        actualCash: Number(actualCashInput) || 0,
        notes: closeNotesInput,
        nextStaffName: nextStaffNameInput.trim() || undefined,
      });
      setIsCloseShiftModal(false);
      setCloseNotesInput('');
      setNextStaffNameInput('');
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi chốt két');
    }
  };

  const calculateDifference = () => {
    if (!currentShift) return 0;
    return (Number(actualCashInput) || 0) - currentShift.expectedCash;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>💼</span> Giao Ca & Chốt Két Thu Ngân
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý quỹ tiền mặt đầu ca, theo dõi doanh thu thực tế và đối soát bàn giao ca trực (Cash Drawer Handover)
          </p>
        </div>

        <div>
          {!currentShift ? (
            <button
              onClick={() => {
                setErrorMessage('');
                setIsOpenShiftModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all"
            >
              <span>✨</span> Mở Ca Làm Việc Mới
            </button>
          ) : (
            <button
              onClick={() => {
                setErrorMessage('');
                setActualCashInput(currentShift.expectedCash);
                setIsCloseShiftModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all"
            >
              <span>🔒</span> Chốt Két & Bàn Giao Ca
            </button>
          )}
        </div>
      </div>

      {/* Ca Trực Hiện Tại (Active Shift Banner) */}
      {currentShift ? (
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-300 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-200/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-amber-500/30">
                🟢
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Đang hoạt động
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-600">{currentShift.shiftCode}</span>
                </div>
                <h3 className="text-lg font-black text-slate-800 mt-0.5">{currentShift.shiftName}</h3>
                <p className="text-xs text-slate-500">
                  Phụ trách: <strong className="text-slate-700">{currentShift.staffName}</strong> • Bắt đầu lúc:{' '}
                  {formatDateTime(currentShift.openedAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActualCashInput(currentShift.expectedCash);
                  setIsCloseShiftModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-sm transition-all"
              >
                Chốt Két Ngay
              </button>
            </div>
          </div>

          {/* Shift Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Quỹ đầu ca (Tiền lẻ)</span>
              <div className="text-base font-black text-slate-800 mt-1">
                {formatCurrency(currentShift.initialFloat)}
              </div>
              <span className="text-[10px] text-slate-400">Tiền thối sẵn trong két</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-emerald-600 uppercase">Tiền mặt thu trong ca</span>
              <div className="text-base font-black text-emerald-600 mt-1">
                {formatCurrency(currentShift.cashSales)}
              </div>
              <span className="text-[10px] text-slate-400">Từ các đơn hoàn tất</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-blue-600 uppercase">Chuyển khoản VietQR</span>
              <div className="text-base font-black text-blue-600 mt-1">
                {formatCurrency(currentShift.qrSales)}
              </div>
              <span className="text-[10px] text-slate-400">Đã vào tài khoản ngân hàng</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Tổng doanh số ({currentShift.orderCount} đơn)</span>
              <div className="text-base font-black text-slate-900 mt-1">
                {formatCurrency(currentShift.totalSales)}
              </div>
              <span className="text-[10px] text-slate-400">Tiền mặt + Chuyển khoản</span>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase">Tiền két dự kiến</span>
              <div className="text-base font-black text-amber-600 mt-1">
                {formatCurrency(currentShift.expectedCash)}
              </div>
              <span className="text-[10px] text-amber-700">Đầu ca + Tiền mặt thu</span>
            </div>
          </div>

          {currentShift.notes && (
            <div className="mt-3 text-xs bg-white/70 p-2.5 rounded-lg border border-amber-200/50 text-slate-600">
              <strong className="text-amber-800">Ghi chú mở ca:</strong> {currentShift.notes}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-200 text-slate-500 mx-auto flex items-center justify-center text-3xl mb-3">
            📭
          </div>
          <h3 className="text-base font-bold text-slate-800">Chưa có ca làm việc nào đang mở</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Thu ngân vui lòng bấm nút "Mở Ca Làm Việc Mới" để khai báo quỹ tiền thối đầu ca và bắt đầu phiên bán hàng.
          </p>
          <button
            onClick={() => {
              setErrorMessage('');
              setIsOpenShiftModal(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 transition-all"
          >
            <span>✨</span> Mở Ca Làm Việc Ngay
          </button>
        </div>
      )}

      {/* Danh Sách Lịch Sử Ca Trực (Shift History / Z-Reports) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Lịch Sử Các Ca Trực & Biên Bản Bàn Giao</h3>
          <span className="text-xs text-slate-500">Tổng cộng {shifts.length} phiên ca</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Mã ca / Tên ca</th>
                <th className="px-4 py-3">Thu ngân</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3 text-right">Đầu ca</th>
                <th className="px-4 py-3 text-right">Tiền mặt</th>
                <th className="px-4 py-3 text-right">VietQR</th>
                <th className="px-4 py-3 text-right">Tổng D.Thu</th>
                <th className="px-4 py-3 text-right">Thực tế két</th>
                <th className="px-4 py-3 text-center">Chênh lệch</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {shifts.map((s) => {
                const diff = s.difference ?? (s.actualCash !== undefined ? s.actualCash - s.expectedCash : 0);
                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{s.shiftName}</div>
                      <div className="text-[11px] font-mono text-slate-400">{s.shiftCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-700">{s.staffName}</div>
                      {s.nextStaffName && (
                        <div className="text-[10px] text-slate-400">➡️ Giao cho: {s.nextStaffName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px] space-y-0.5">
                      <div>Mở: {formatDateTime(s.openedAt)}</div>
                      {s.closedAt && (
                        <div className="text-slate-400">Đóng: {formatDateTime(s.closedAt)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(s.initialFloat)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                      {formatCurrency(s.cashSales)}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600 font-semibold">
                      {formatCurrency(s.qrSales)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatCurrency(s.totalSales)}
                      <span className="text-[10px] text-slate-400 block font-normal">({s.orderCount} đơn)</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      {s.actualCash !== undefined ? formatCurrency(s.actualCash) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.status === 'open' ? (
                        <span className="text-slate-400">—</span>
                      ) : diff === 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                          Khớp (0đ)
                        </span>
                      ) : diff > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                          +{formatCurrency(diff)}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                          {formatCurrency(diff)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.status === 'open' ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                          Đang Mở
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
                          Đã Chốt
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedShiftForDetail(s)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Mở Ca Mới */}
      {isOpenShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>✨</span> Mở Ca Làm Việc Mới
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Nhân viên: <strong className="text-slate-700">{currentStaff.name}</strong> ({currentStaff.role === 'owner' ? 'Chủ tiệm' : 'Thu ngân'})
            </p>

            {errorMessage && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleOpenShift} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên ca làm việc</label>
                <select
                  value={shiftNameInput}
                  onChange={(e) => setShiftNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="Ca Sáng (06:30 - 14:30)">Ca Sáng (06:30 - 14:30)</option>
                  <option value="Ca Chiều (14:30 - 22:30)">Ca Chiều (14:30 - 22:30)</option>
                  <option value="Ca Tối / Tăng Cường">Ca Tối / Tăng Cường</option>
                  <option value="Ca Nguyên Ngày">Ca Nguyên Ngày</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quỹ tiền mặt đầu ca (Tiền thối / tiền lẻ trong két)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="10000"
                    min="0"
                    value={initialFloatInput}
                    onChange={(e) => setInitialFloatInput(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 pr-12 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">VNĐ</span>
                </div>
                <div className="flex gap-2 mt-1.5">
                  {[300000, 500000, 1000000].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setInitialFloatInput(amt)}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                    >
                      {formatCurrency(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú bàn giao đầu ca (nếu có)</label>
                <textarea
                  value={openNotesInput}
                  onChange={(e) => setOpenNotesInput(e.target.value)}
                  placeholder="Ví dụ: Đã nhận két 500k từ bạn An, cuộn giấy in bill còn 2 cuộn..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpenShiftModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/20"
                >
                  Xác Nhận Mở Ca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chốt Két & Kết Thúc Ca */}
      {isCloseShiftModal && currentShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>🔒</span> Chốt Két & Bàn Giao Ca Trực
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mã ca: <strong className="text-slate-700">{currentShift.shiftCode}</strong> • {currentShift.shiftName}
            </p>

            {errorMessage && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {errorMessage}
              </div>
            )}

            {/* Quick Summary in modal */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 my-4 text-xs">
              <div>
                <span className="text-slate-500">Quỹ đầu ca:</span>
                <span className="font-bold text-slate-800 ml-1">{formatCurrency(currentShift.initialFloat)}</span>
              </div>
              <div>
                <span className="text-slate-500">Thu tiền mặt:</span>
                <span className="font-bold text-emerald-600 ml-1">+{formatCurrency(currentShift.cashSales)}</span>
              </div>
              <div>
                <span className="text-slate-500">Thu VietQR:</span>
                <span className="font-bold text-blue-600 ml-1">{formatCurrency(currentShift.qrSales)}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold">Két dự kiến:</span>
                <span className="font-black text-amber-600 ml-1">{formatCurrency(currentShift.expectedCash)}</span>
              </div>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số tiền mặt đếm thực tế trong két (Actual Cash Count) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 pr-12 rounded-xl border border-slate-300 text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">VNĐ</span>
                </div>

                {/* Diff calculation tag */}
                <div className="mt-2 p-2 rounded-xl text-xs flex items-center justify-between border">
                  <span>Chênh lệch đối soát:</span>
                  {calculateDifference() === 0 ? (
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
                      Khớp 100% (0đ)
                    </span>
                  ) : calculateDifference() > 0 ? (
                    <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-lg">
                      Thừa +{formatCurrency(calculateDifference())}
                    </span>
                  ) : (
                    <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg">
                      Thiếu {formatCurrency(calculateDifference())}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nhân viên nhận bàn giao ca tiếp theo
                </label>
                <input
                  type="text"
                  value={nextStaffNameInput}
                  onChange={(e) => setNextStaffNameInput(e.target.value)}
                  placeholder="Ví dụ: Lê Hoàng Yến (Thu ngân ca chiều)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú biên bản chốt két
                </label>
                <textarea
                  value={closeNotesInput}
                  onChange={(e) => setCloseNotesInput(e.target.value)}
                  placeholder="Ghi chú về tiền thừa/thiếu, hóa đơn hủy hoặc vấn đề phát sinh trong ca..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCloseShiftModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-md shadow-amber-500/20"
                >
                  Xác Nhận & Đóng Ca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xem Chi Tiết Biên Bản Bàn Giao Ca (Z-Report Detail) */}
      {selectedShiftForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">BIÊN BẢN GIAO CA</span>
                <h3 className="text-base font-bold text-slate-800">{selectedShiftForDetail.shiftName}</h3>
              </div>
              <button
                onClick={() => setSelectedShiftForDetail(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Mã ca:</span>
                <span className="font-mono font-bold">{selectedShiftForDetail.shiftCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thu ngân phụ trách:</span>
                <span className="font-semibold">{selectedShiftForDetail.staffName}</span>
              </div>
              {selectedShiftForDetail.nextStaffName && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Người nhận bàn giao:</span>
                  <span className="font-semibold text-amber-700">{selectedShiftForDetail.nextStaffName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Thời gian mở ca:</span>
                <span>{formatDateTime(selectedShiftForDetail.openedAt)}</span>
              </div>
              {selectedShiftForDetail.closedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Thời gian chốt ca:</span>
                  <span>{formatDateTime(selectedShiftForDetail.closedAt)}</span>
                </div>
              )}

              <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Quỹ tiền mặt đầu ca:</span>
                  <span className="font-semibold">{formatCurrency(selectedShiftForDetail.initialFloat)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Doanh số tiền mặt ({selectedShiftForDetail.orderCount} đơn):</span>
                  <span className="font-semibold">+{formatCurrency(selectedShiftForDetail.cashSales)}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>Doanh số VietQR:</span>
                  <span className="font-semibold">+{formatCurrency(selectedShiftForDetail.qrSales)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1.5">
                  <span>Tổng doanh số ca:</span>
                  <span>{formatCurrency(selectedShiftForDetail.totalSales)}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-700 bg-amber-50 p-2 rounded-lg">
                  <span>Tiền két dự kiến:</span>
                  <span>{formatCurrency(selectedShiftForDetail.expectedCash)}</span>
                </div>
                {selectedShiftForDetail.actualCash !== undefined && (
                  <div className="flex justify-between font-bold text-slate-800 p-2 rounded-lg bg-slate-50">
                    <span>Tiền thực tế kiểm đếm:</span>
                    <span>{formatCurrency(selectedShiftForDetail.actualCash)}</span>
                  </div>
                )}
                {selectedShiftForDetail.difference !== undefined && (
                  <div className="flex justify-between font-bold text-xs p-2 rounded-lg">
                    <span>Chênh lệch:</span>
                    <span className={selectedShiftForDetail.difference === 0 ? 'text-emerald-600' : selectedShiftForDetail.difference > 0 ? 'text-blue-600' : 'text-rose-600'}>
                      {selectedShiftForDetail.difference === 0
                        ? 'Khớp 100% (0đ)'
                        : `${selectedShiftForDetail.difference > 0 ? '+' : ''}${formatCurrency(selectedShiftForDetail.difference)}`}
                    </span>
                  </div>
                )}
              </div>

              {selectedShiftForDetail.notes && (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-600 mt-2">
                  <strong className="text-slate-700">Ghi chú bàn giao:</strong> {selectedShiftForDetail.notes}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedShiftForDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
