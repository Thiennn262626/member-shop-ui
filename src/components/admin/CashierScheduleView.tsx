import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Check,
  Send,
} from 'lucide-react';
import { mockDb } from '../../services/mockDb';
import type { StaffAccount, WorkShift } from '../../types';
import { formatCurrency } from '../../utils/format';

interface CashierScheduleViewProps {
  currentStaff: StaffAccount;
}

export const CashierScheduleView: React.FC<CashierScheduleViewProps> = ({ currentStaff }) => {
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedShiftForLeave, setSelectedShiftForLeave] = useState<WorkShift | null>(null);
  const [leaveReason, setLeaveReason] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Month selector for statistics
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  const loadData = () => {
    const list = mockDb.getWorkShifts(currentStaff.id);
    setShifts(list);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('bake_sip_work_shifts_updated', handleUpdate);
    return () => {
      window.removeEventListener('bake_sip_work_shifts_updated', handleUpdate);
    };
  }, [currentStaff.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Thống kê tháng của thu ngân
  const monthShifts = useMemo(() => {
    return shifts.filter((s) => s.date.startsWith(selectedMonth));
  }, [shifts, selectedMonth]);

  const completedMonthShifts = monthShifts.filter((s) => s.status === 'completed');
  const totalActualHours = completedMonthShifts.reduce(
    (sum, s) => sum + (s.actualHours !== undefined ? s.actualHours : s.scheduledHours),
    0
  );
  const hourlyRate = currentStaff.hourlyRate || 28000;
  const estimatedSalary = Math.round(totalActualHours * hourlyRate);

  // Điểm danh vào ca
  const handleCheckIn = (shift: WorkShift) => {
    try {
      mockDb.checkInWorkShift(shift.id);
      showToast(`✓ Đã điểm danh vào ca "${shift.shiftTitle}" thành công!`);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Lỗi khi điểm danh');
    }
  };

  // Điểm danh tan ca (Check-out)
  const handleCheckOut = (shift: WorkShift) => {
    try {
      mockDb.checkOutWorkShift(shift.id);
      showToast(`✓ Đã xác nhận tan ca! Giờ làm việc thực tế đã được lưu vào bảng công.`);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Lỗi khi tan ca');
    }
  };

  // Báo xin nghỉ đột xuất
  const handleOpenLeaveModal = (shift: WorkShift) => {
    setSelectedShiftForLeave(shift);
    setLeaveReason('');
    setIsLeaveModalOpen(true);
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftForLeave) return;
    if (!leaveReason.trim()) {
      alert('Vui lòng nhập lý do xin nghỉ');
      return;
    }

    try {
      mockDb.recordWorkShiftLeave(
        selectedShiftForLeave.id,
        'leave_excused',
        `Xin nghỉ đột xuất: ${leaveReason.trim()}`
      );
      showToast(`Đã gửi thông báo xin nghỉ ca ngày ${selectedShiftForLeave.date} đến Chủ tiệm.`);
      setIsLeaveModalOpen(false);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Lỗi gửi yêu cầu');
    }
  };

  const getStatusBadge = (s: WorkShift) => {
    switch (s.status) {
      case 'in_progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] animate-pulse">
            🟢 Đang làm việc
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
            ✓ Đã hoàn tất ({s.actualHours !== undefined ? s.actualHours : s.scheduledHours}h)
          </span>
        );
      case 'leave_excused':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
            ⚠️ Nghỉ có phép
          </span>
        );
      case 'leave_unexcused':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
            ❌ Nghỉ không phép
          </span>
        );
      case 'swapped':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[11px]">
            🔄 Đã đổi ca
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
            📅 Sắp tới
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-amber-300 px-4 py-3 rounded-2xl shadow-xl border border-stone-700 flex items-center gap-2 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 rounded-3xl p-5 sm:p-6 border border-amber-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded-md">
                Giao diện Thu Ngân
              </span>
              <span className="text-xs text-stone-500">• {currentStaff.name}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-serif font-black text-stone-900 mt-1">
              Lịch Làm Việc & Chấm Công Của Tôi
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Theo dõi các ca trực được chủ tiệm phân công, điểm danh vào/ra ca và kiểm tra tổng số tiếng tính lương
            </p>
          </div>

          {/* Month switch for personal earnings summary */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs font-bold text-stone-600">Tháng:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold font-mono text-stone-900 border-none outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Stats Grid for the cashier */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-amber-200/60">
          <div className="bg-white/90 p-3 rounded-2xl border border-amber-100 shadow-2xs">
            <span className="text-[10px] text-stone-400 uppercase font-bold block">Số Ca Được Xếp</span>
            <span className="text-lg font-black text-stone-900 font-mono mt-0.5 block">
              {monthShifts.length} <span className="text-xs font-normal text-stone-500">ca</span>
            </span>
          </div>

          <div className="bg-white/90 p-3 rounded-2xl border border-amber-100 shadow-2xs">
            <span className="text-[10px] text-emerald-600 uppercase font-bold block">Ca Đã Hoàn Thành</span>
            <span className="text-lg font-black text-emerald-700 font-mono mt-0.5 block">
              {completedMonthShifts.length} <span className="text-xs font-normal text-stone-500">ca</span>
            </span>
          </div>

          <div className="bg-white/90 p-3 rounded-2xl border border-amber-100 shadow-2xs">
            <span className="text-[10px] text-amber-700 uppercase font-bold block">Tổng Tiếng Thực Tế</span>
            <span className="text-lg font-black text-amber-800 font-mono mt-0.5 block">
              {Math.round(totalActualHours * 10) / 10} <span className="text-xs font-normal text-stone-500">giờ</span>
            </span>
          </div>

          <div className="bg-white/90 p-3 rounded-2xl border border-amber-100 shadow-2xs">
            <span className="text-[10px] text-purple-700 uppercase font-bold block">
              Lương Tạm Tính ({formatCurrency(hourlyRate)}/h)
            </span>
            <span className="text-lg font-black text-purple-900 font-mono mt-0.5 block">
              {formatCurrency(estimatedSalary)}
            </span>
          </div>
        </div>
      </div>

      {/* Danh sách các ca trực của Thu Ngân */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Danh Sách Ca Trực Được Phân Công ({shifts.length} ca)</span>
          </h3>
          <span className="text-xs text-stone-400">Tự động đồng bộ với hệ thống cửa hàng</span>
        </div>

        {shifts.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">
            <Coffee className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            Hiện bạn chưa có ca làm việc nào được phân công trong khoảng thời gian này.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {shifts.map((shift) => {
              const isToday = shift.date === new Date().toISOString().slice(0, 10);

              return (
                <div
                  key={shift.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    shift.status === 'in_progress'
                      ? 'bg-emerald-50/50'
                      : isToday
                      ? 'bg-amber-50/30'
                      : 'hover:bg-stone-50/50'
                  }`}
                >
                  {/* Left: Date & Shift Info */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                        {shift.date}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                          Hôm nay
                        </span>
                      )}
                      {getStatusBadge(shift)}
                    </div>

                    <div className="text-sm font-black text-stone-800">{shift.shiftTitle}</div>

                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        Giờ dự kiến: {shift.scheduledStartTime} - {shift.scheduledEndTime} ({shift.scheduledHours}h)
                      </span>
                      {shift.actualStartTime && (
                        <span className="text-emerald-700 font-semibold font-mono">
                          • Thực tế: {shift.actualStartTime} {shift.actualEndTime ? `- ${shift.actualEndTime}` : '(Đang làm)'}
                        </span>
                      )}
                    </div>

                    {shift.notes && (
                      <div className="text-[11px] text-stone-600 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/80 inline-block mt-1">
                        <strong>Ghi chú phân công:</strong> {shift.notes}
                      </div>
                    )}

                    {shift.actualNotes && (
                      <div className="text-[11px] text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80 inline-block mt-1">
                        <strong>Chấm công:</strong> {shift.actualNotes}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions for Cashier */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    {/* Nút Điểm danh vào ca */}
                    {shift.status === 'scheduled' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCheckIn(shift)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Điểm Danh Vào Ca</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenLeaveModal(shift)}
                          className="px-3 py-2 bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-600 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                        >
                          Báo Xin Nghỉ
                        </button>
                      </>
                    )}

                    {/* Nút Tan ca */}
                    {shift.status === 'in_progress' && (
                      <button
                        type="button"
                        onClick={() => handleCheckOut(shift)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer animate-bounce"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Xác Nhận Tan Ca</span>
                      </button>
                    )}

                    {/* Hoàn tất */}
                    {shift.status === 'completed' && (
                      <span className="text-xs font-bold text-stone-500 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>+ {shift.actualHours !== undefined ? shift.actualHours : shift.scheduledHours} tiếng</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Báo Xin Nghỉ Đột Xuất */}
      {isLeaveModalOpen && selectedShiftForLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span>Báo Xin Nghỉ Ca Đột Xuất</span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Ca: <strong>{selectedShiftForLeave.shiftTitle}</strong> ngày <strong>{selectedShiftForLeave.date}</strong>
            </p>

            <form onSubmit={handleSubmitLeave} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Lý do xin nghỉ đột xuất / cần hỗ trợ đổi ca <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Ví dụ: Bị ốm đột xuất, việc gia đình gấp, đã nhờ bạn Yến trực thay..."
                  rows={3}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Báo Cáo Cho Chủ Tiệm</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
