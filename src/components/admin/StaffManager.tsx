import React, { useState, useMemo, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Edit2,
  Shield,
  CheckCircle2,
  Phone,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Save,
  RotateCcw,
  Check,
  Eye,
  CheckCheck,
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import type { AdminRole, MonthlyPayrollSummary, StaffAccount, WorkShift, WorkShiftStatus } from '../../types';
import { formatCurrency } from '../../utils/format';
import { CashierScheduleView } from './CashierScheduleView';

interface StaffManagerProps {
  currentStaff?: StaffAccount;
  userRole?: AdminRole;
}

const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

export const StaffManager: React.FC<StaffManagerProps> = ({
  currentStaff,
  userRole = currentStaff?.role || 'owner',
}) => {
  // If the user is a cashier, show their personalized schedule view
  if (userRole === 'cashier' && currentStaff) {
    return <CashierScheduleView currentStaff={currentStaff} />;
  }

  // --- OWNER MANAGEMENT PORTAL ---
  const [activeTab, setActiveTab] = useState<'assign_calendar' | 'overview_calendar' | 'payroll' | 'accounts'>('assign_calendar');
  const [staffList, setStaffList] = useState<StaffAccount[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Month navigation (YYYY-MM)
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Selected staff for assigning shifts
  const [assigningStaffId, setAssigningStaffId] = useState<string>('');

  // Pending shift selections for assigning: Map of `${date}_${shiftType}` -> boolean
  // Example: { '2026-03-24_morning': true, '2026-03-24_afternoon': false }
  const [pendingSelections, setPendingSelections] = useState<Record<string, boolean>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modal quick attendance confirmation
  const [quickConfirmShift, setQuickConfirmShift] = useState<WorkShift | null>(null);
  const [confirmHoursInput, setConfirmHoursInput] = useState<number>(8.0);
  const [confirmStatusInput, setConfirmStatusInput] = useState<WorkShiftStatus>('completed');
  const [confirmNotesInput, setConfirmNotesInput] = useState<string>('');

  // Accounts CRUD Modal
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<StaffAccount | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<AdminRole>('cashier');
  const [formPhone, setFormPhone] = useState('');
  const [formHourlyRate, setFormHourlyRate] = useState<number>(28000);
  const [formPinCode, setFormPinCode] = useState('123456');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Payroll summary
  const [payrollList, setPayrollList] = useState<MonthlyPayrollSummary[]>([]);

  // Load database
  const loadData = async () => {
    try {
      const [accounts, shifts, payroll] = await Promise.all([
        storeService.getStaffAccounts(),
        storeService.getWorkShifts(),
        storeService.getMonthlyPayrolls(selectedMonth),
      ]);
      setStaffList(accounts);
      setWorkShifts(shifts);
      setPayrollList(payroll);
      if (!assigningStaffId && accounts.length > 0) {
        const defaultStaff = accounts.find((s) => s.role === 'cashier') || accounts[0];
        setAssigningStaffId(defaultStaff.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const handleStaffUpdate = () => loadData();
    const handleWorkShiftsUpdate = () => loadData();
    const handlePayrollUpdate = () => loadData();

    window.addEventListener('bake_sip_staff_updated', handleStaffUpdate);
    window.addEventListener('bake_sip_work_shifts_updated', handleWorkShiftsUpdate);
    window.addEventListener('bake_sip_payroll_updated', handlePayrollUpdate);

    return () => {
      window.removeEventListener('bake_sip_staff_updated', handleStaffUpdate);
      window.removeEventListener('bake_sip_work_shifts_updated', handleWorkShiftsUpdate);
      window.removeEventListener('bake_sip_payroll_updated', handlePayrollUpdate);
    };
  }, [selectedMonth]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Switch month helper
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setSelectedMonth(`${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    setSelectedMonth(`${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`);
  };

  // Current selected employee object
  const currentAssigningStaff = useMemo(() => {
    return staffList.find((s) => s.id === assigningStaffId) || staffList[0];
  }, [staffList, assigningStaffId]);

  // Sync pending selections when changing employee or month
  useEffect(() => {
    if (!assigningStaffId) return;
    const initialMap: Record<string, boolean> = {};
    const existing = workShifts.filter(
      (s) => s.staffId === assigningStaffId && s.date.startsWith(selectedMonth)
    );
    existing.forEach((s) => {
      const type = s.shiftType || (s.scheduledStartTime < '13:00' ? 'morning' : 'afternoon');
      initialMap[`${s.date}_${type}`] = true;
    });
    setPendingSelections(initialMap);
    setHasUnsavedChanges(false);
  }, [assigningStaffId, selectedMonth, workShifts]);

  // Generate calendar days for selectedMonth
  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
    // Monday first index: 0 = Mon, ..., 6 = Sun
    const padStartCount = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Pad days from previous month
    const prevMonthDaysCount = new Date(year, month - 1, 0).getDate();
    for (let i = padStartCount - 1; i >= 0; i--) {
      const dayNum = prevMonthDaysCount - i;
      const prevM = month - 1 === 0 ? 12 : month - 1;
      const prevY = month - 1 === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Days in current month
    const todayISO = new Date().toISOString().slice(0, 10);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayISO,
      });
    }

    // Pad end of calendar to complete 7-column rows
    const remainder = days.length % 7;
    if (remainder > 0) {
      const padEndCount = 7 - remainder;
      const nextM = month + 1 === 13 ? 1 : month + 1;
      const nextY = month + 1 === 13 ? year + 1 : year;
      for (let i = 1; i <= padEndCount; i++) {
        const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        days.push({
          dateStr,
          dayNumber: i,
          isCurrentMonth: false,
          isToday: false,
        });
      }
    }

    return days;
  }, [selectedMonth]);

  // Shifts grouped by date and shiftType
  const shiftsByDateAndType = useMemo(() => {
    const map: Record<string, { morning: WorkShift[]; afternoon: WorkShift[] }> = {};
    workShifts.forEach((s) => {
      if (!map[s.date]) {
        map[s.date] = { morning: [], afternoon: [] };
      }
      const type = s.shiftType || (s.scheduledStartTime < '13:00' ? 'morning' : 'afternoon');
      if (type === 'morning') {
        map[s.date].morning.push(s);
      } else {
        map[s.date].afternoon.push(s);
      }
    });
    return map;
  }, [workShifts]);

  // Toggle shift for selected employee on a specific date
  const handleToggleShiftSelection = (dateStr: string, shiftType: 'morning' | 'afternoon') => {
    const key = `${dateStr}_${shiftType}`;
    setPendingSelections((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
    setHasUnsavedChanges(true);
  };

  // Save all pending shifts
  const handleSaveAllSchedule = async () => {
    if (!currentAssigningStaff) return;

    const assignments: Array<{ date: string; shiftType: 'morning' | 'afternoon' }> = [];
    Object.keys(pendingSelections).forEach((key) => {
      if (pendingSelections[key]) {
        const [date, shiftType] = key.split('_');
        if (date && (shiftType === 'morning' || shiftType === 'afternoon')) {
          assignments.push({ date, shiftType });
        }
      }
    });

    try {
      await storeService.saveMonthlyRoster(currentAssigningStaff.id, selectedMonth, assignments);
      showToast(
        `✓ Đã lưu toàn bộ ${assignments.length} ca làm việc tháng ${selectedMonth} cho ${currentAssigningStaff.name}!`
      );
      setHasUnsavedChanges(false);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Lỗi khi lưu lịch làm việc');
    }
  };

  // Quick attendance confirmation popup handler
  const handleOpenQuickConfirm = (shift: WorkShift) => {
    setQuickConfirmShift(shift);
    setConfirmHoursInput(shift.actualHours !== undefined ? shift.actualHours : shift.scheduledHours || 8.0);
    setConfirmStatusInput(shift.status === 'scheduled' ? 'completed' : shift.status);
    setConfirmNotesInput(shift.actualNotes || '');
  };

  const handleSaveQuickConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickConfirmShift) return;

    try {
      await storeService.confirmDailyAttendance(
        quickConfirmShift.id,
        confirmHoursInput,
        confirmStatusInput,
        confirmNotesInput.trim() || undefined
      );
      showToast(`✓ Đã chốt số tiếng ngày ${quickConfirmShift.date}: ${confirmHoursInput} giờ!`);
      setQuickConfirmShift(null);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Lỗi khi chấm công');
    }
  };

  // Accounts CRUD
  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setFormUsername('');
    setFormName('');
    setFormRole('cashier');
    setFormPhone('');
    setFormHourlyRate(28000);
    setFormPinCode('123456');
    setFormIsActive(true);
    setFormError(null);
    setIsAccountModalOpen(true);
  };

  const handleOpenEditAccount = (staff: StaffAccount) => {
    setEditingAccount(staff);
    setFormUsername(staff.username);
    setFormName(staff.name);
    setFormRole(staff.role);
    setFormPhone(staff.phone || '');
    setFormHourlyRate(staff.hourlyRate || 28000);
    setFormPinCode(staff.pinCode);
    setFormIsActive(staff.isActive);
    setFormError(null);
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formUsername.trim()) return setFormError('Vui lòng nhập tên đăng nhập.');
    if (!formName.trim()) return setFormError('Vui lòng nhập họ tên.');

    try {
      if (editingAccount) {
        await storeService.updateStaffAccount(editingAccount.id, {
          username: formUsername.trim().toLowerCase(),
          name: formName.trim(),
          role: formRole,
          phone: formPhone.trim() || undefined,
          hourlyRate: Number(formHourlyRate) || 28000,
          pinCode: formPinCode.trim(),
          isActive: formIsActive,
        });
        showToast(`Đã cập nhật nhân viên "${formName}"!`);
      } else {
        await storeService.addStaffAccount({
          username: formUsername.trim().toLowerCase(),
          name: formName.trim(),
          role: formRole,
          phone: formPhone.trim() || undefined,
          shift: 'Ca Linh Hoạt',
          hourlyRate: Number(formHourlyRate) || 28000,
          pinCode: formPinCode.trim(),
          isActive: formIsActive,
        });
        showToast(`Đã thêm nhân viên mới "${formName}"!`);
      }
      setIsAccountModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu tài khoản');
    }
  };

  const handleUpdateAdjustment = async (staffId: string, allowance?: number, deduction?: number) => {
    try {
      const target = payrollList.find((p) => p.staffId === staffId);
      const allow = allowance !== undefined ? allowance : (target?.allowance || 0);
      const deduct = deduction !== undefined ? deduction : (target?.deduction || 0);
      await storeService.adjustMonthlyPayroll(staffId, selectedMonth, allow, deduct);
      const payroll = await storeService.getMonthlyPayrolls(selectedMonth);
      setPayrollList(payroll);
    } catch (err) {
      console.error(err);
    }
  };

  // Monthly stats
  const totalMonthCompletedShifts = payrollList.reduce((sum, p) => sum + p.totalCompletedShifts, 0);
  const totalMonthActualHours = payrollList.reduce((sum, p) => sum + p.totalActualHours, 0);
  const totalMonthPayrollAmount = payrollList.reduce((sum, p) => sum + p.finalSalary, 0);
  const isMonthFinalized = payrollList.length > 0 && payrollList.every((p) => p.isFinalized);

  const pendingSelectedCount = Object.values(pendingSelections).filter(Boolean).length;

  return (
    <div className="flex-1 p-3 sm:p-6 max-w-[1600px] mx-auto w-full space-y-5 font-sans animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-amber-300 px-4 py-3 rounded-2xl shadow-xl border border-stone-700 flex items-center gap-2 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-serif font-extrabold text-stone-900 text-lg sm:text-xl">
                Tờ Lịch Phân Ca & Chấm Công Vận Hành
              </h2>
              <span className="text-xs text-stone-500">
                Xếp ca trực quan bằng 1 cú nhấp, tự động đối soát tránh giao trùng nhân viên và chốt công cuối ngày
              </span>
            </div>
          </div>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-white text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-mono font-black text-sm text-stone-800">
              Tháng {selectedMonth.slice(5)} / {selectedMonth.slice(0, 4)}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-white text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              title="Tháng tiếp theo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto text-xs sm:text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('assign_calendar')}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'assign_calendar'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Xếp Ca Cho Từng Nhân Viên (Theo Tờ Lịch)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overview_calendar')}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'overview_calendar'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Tổng Quan Toàn Tiệm (Ai Làm Buổi Nào)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payroll')}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'payroll'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Bảng Chấm Công & Chốt Lương Tháng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'accounts'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Hồ Sơ & Mức Lương Nhân Viên</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: XẾP CA CHO TỪNG NHÂN VIÊN (BẤM VÀO NHÂN VIÊN -> HIỆN TỜ LỊCH THÁNG) */}
      {/* ========================================================================= */}
      {activeTab === 'assign_calendar' && (
        <div className="space-y-4">
          {/* Employee Selector Bar */}
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                  Bước 1: Chọn nhân viên cần xếp ca làm việc
                </span>
                <span className="text-xs text-stone-400">
                  Lịch của các nhân viên khác sẽ tự động hiển thị để tránh giao trùng ca
                </span>
              </div>

              {/* Save All Schedule Button */}
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <button
                    type="button"
                    onClick={() => {
                      const initialMap: Record<string, boolean> = {};
                      workShifts
                        .filter((s) => s.staffId === assigningStaffId && s.date.startsWith(selectedMonth))
                        .forEach((s) => {
                          const type = s.shiftType || (s.scheduledStartTime < '13:00' ? 'morning' : 'afternoon');
                          initialMap[`${s.date}_${type}`] = true;
                        });
                      setPendingSelections(initialMap);
                      setHasUnsavedChanges(false);
                    }}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Hủy thay đổi</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveAllSchedule}
                  disabled={!hasUnsavedChanges}
                  className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                    hasUnsavedChanges
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 animate-pulse'
                      : 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200 shadow-none'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>
                    Lưu Toàn Bộ Lịch Phân Ca ({pendingSelectedCount} ca đã chọn)
                  </span>
                </button>
              </div>
            </div>

            {/* Staff Pill Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {staffList.map((staff) => {
                const isSelected = staff.id === assigningStaffId;
                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => setAssigningStaffId(staff.id)}
                    className={`px-4 py-2.5 rounded-2xl border transition-all text-xs font-bold flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'border-amber-600 bg-amber-500 text-white shadow-md shadow-amber-500/20'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                        isSelected ? 'bg-white text-amber-800' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {staff.role === 'owner' ? '👑' : '🧑‍💼'}
                    </div>
                    <span>{staff.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                        isSelected ? 'bg-amber-700/60 text-amber-100' : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {formatCurrency(staff.hourlyRate || 28000)}/h
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Đang xếp ca cho: <strong className="font-extrabold text-stone-900">{currentAssigningStaff?.name}</strong>.
                Chỉ cần nhấp chuột vào ô <strong>[Ca Sáng]</strong> hoặc <strong>[Ca Chiều]</strong> của từng ngày để chọn.
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Đã chọn cho nhân viên này
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-stone-200 inline-block" /> Người khác đã làm
              </span>
            </div>
          </div>

          {/* ====================================================== */}
          {/* THE MASTER MONTHLY CALENDAR GRID (TỜ LỊCH THÁNG)       */}
          {/* ====================================================== */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-x-auto">
            <div className="min-w-[760px]">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 bg-stone-50 border-b border-stone-200 text-center text-xs font-bold text-stone-600 uppercase tracking-wider py-2.5">
              {WEEKDAYS.map((wd, idx) => (
                <div key={idx} className={idx >= 5 ? 'text-amber-700 font-extrabold' : ''}>
                  {wd}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-stone-100">
              {calendarDays.map((day, idx) => {
                const dayShifts = shiftsByDateAndType[day.dateStr] || { morning: [], afternoon: [] };

                // Check other staff assigned to Morning
                const morningOtherStaff = dayShifts.morning.filter(
                  (s) => s.staffId !== assigningStaffId
                );
                // Check other staff assigned to Afternoon
                const afternoonOtherStaff = dayShifts.afternoon.filter(
                  (s) => s.staffId !== assigningStaffId
                );

                // Is morning selected for current assigning staff?
                const isMorningSelected = !!pendingSelections[`${day.dateStr}_morning`];
                // Is afternoon selected for current assigning staff?
                const isAfternoonSelected = !!pendingSelections[`${day.dateStr}_afternoon`];

                // Any completed shift on this day for quick confirmation?
                const shiftsToConfirm = [...dayShifts.morning, ...dayShifts.afternoon].filter(
                  (s) => s.status === 'scheduled' || s.status === 'in_progress' || s.status === 'completed'
                );

                return (
                  <div
                    key={idx}
                    className={`min-h-[140px] p-2 flex flex-col justify-between transition-colors ${
                      !day.isCurrentMonth
                        ? 'bg-stone-50/50 opacity-40'
                        : day.isToday
                        ? 'bg-amber-50/30'
                        : 'hover:bg-stone-50/40'
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                      <span
                        className={`text-xs font-mono font-bold ${
                          day.isToday
                            ? 'w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs'
                            : 'text-stone-800'
                        }`}
                      >
                        {day.dayNumber}
                      </span>

                      {/* Quick Confirm attendance button if today or past */}
                      {day.isCurrentMonth && shiftsToConfirm.length > 0 && (
                        <div className="flex items-center gap-1">
                          {shiftsToConfirm.map((s) => {
                            const isDone = s.status === 'completed';
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => handleOpenQuickConfirm(s)}
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded transition-all cursor-pointer ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200 animate-pulse'
                                }`}
                                title={`Chốt giờ làm cho ${s.staffName}`}
                              >
                                {isDone ? `✓ ${s.actualHours !== undefined ? s.actualHours : s.scheduledHours}h` : 'Chốt giờ'}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Middle: Existing other staff assignments (Tránh giao trùng) */}
                    <div className="space-y-1 my-1">
                      {morningOtherStaff.length > 0 && (
                        <div className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded truncate border border-stone-200/60" title={`Sáng đã có: ${morningOtherStaff.map((s) => s.staffName).join(', ')}`}>
                          <span className="font-bold text-amber-800">☀️</span> {morningOtherStaff.map((s) => s.staffName.split(' ')[0]).join(', ')}
                        </div>
                      )}

                      {afternoonOtherStaff.length > 0 && (
                        <div className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded truncate border border-stone-200/60" title={`Chiều đã có: ${afternoonOtherStaff.map((s) => s.staffName).join(', ')}`}>
                          <span className="font-bold text-indigo-700">🌙</span> {afternoonOtherStaff.map((s) => s.staffName.split(' ')[0]).join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Bottom: 2 Components SÁNG & CHIỀU for current assigning employee */}
                    <div className="space-y-1 pt-1 border-t border-stone-100">
                      {/* Component SÁNG */}
                      <button
                        type="button"
                        onClick={() => handleToggleShiftSelection(day.dateStr, 'morning')}
                        className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer border ${
                          isMorningSelected
                            ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white hover:bg-amber-50 text-stone-600 hover:text-amber-800 border-stone-200'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Sun className={`w-3 h-3 ${isMorningSelected ? 'text-white' : 'text-amber-600'}`} />
                          <span>Sáng (8h)</span>
                        </span>
                        {isMorningSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>

                      {/* Component CHIỀU */}
                      <button
                        type="button"
                        onClick={() => handleToggleShiftSelection(day.dateStr, 'afternoon')}
                        className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer border ${
                          isAfternoonSelected
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-xs'
                            : 'bg-white hover:bg-indigo-50 text-stone-600 hover:text-indigo-800 border-stone-200'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Moon className={`w-3 h-3 ${isAfternoonSelected ? 'text-white' : 'text-indigo-600'}`} />
                          <span>Chiều (8h)</span>
                        </span>
                        {isAfternoonSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TỔNG QUAN LỊCH TOÀN TIỆM (NHÌN SƠ QUA LÀ BIẾT BUỔI NÀO CÓ AI LÀM) */}
      {/* ========================================================================= */}
      {activeTab === 'overview_calendar' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-stone-900 text-sm">
                  Tờ Lịch Tổng Thể Toàn Tiệm (Tháng {selectedMonth})
                </h3>
                <span className="text-xs text-stone-500">
                  Xem nhanh nhân sự trực ca sáng & ca chiều, bấm vào từng ca để chốt số tiếng cuối ngày
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-amber-800">
                <Sun className="w-4 h-4 text-amber-600" /> Ca Sáng (06:30 - 14:30)
              </span>
              <span className="flex items-center gap-1.5 font-bold text-indigo-800">
                <Moon className="w-4 h-4 text-indigo-600" /> Ca Chiều (14:30 - 22:30)
              </span>
            </div>
          </div>

          {/* Master Calendar */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-7 bg-stone-50 border-b border-stone-200 text-center text-xs font-bold text-stone-600 uppercase tracking-wider py-2.5">
              {WEEKDAYS.map((wd, idx) => (
                <div key={idx} className={idx >= 5 ? 'text-amber-700 font-extrabold' : ''}>
                  {wd}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-stone-100">
              {calendarDays.map((day, idx) => {
                const dayShifts = shiftsByDateAndType[day.dateStr] || { morning: [], afternoon: [] };
                const hasMorning = dayShifts.morning.length > 0;
                const hasAfternoon = dayShifts.afternoon.length > 0;

                return (
                  <div
                    key={idx}
                    className={`min-h-[135px] p-2 flex flex-col justify-between ${
                      !day.isCurrentMonth
                        ? 'bg-stone-50/50 opacity-40'
                        : day.isToday
                        ? 'bg-amber-50/30'
                        : 'hover:bg-stone-50/40'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                      <span
                        className={`text-xs font-mono font-bold ${
                          day.isToday
                            ? 'w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center'
                            : 'text-stone-800'
                        }`}
                      >
                        {day.dayNumber}
                      </span>
                      {day.isToday && (
                        <span className="text-[9px] font-extrabold uppercase text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                          Hôm nay
                        </span>
                      )}
                    </div>

                    {/* Shifts list */}
                    <div className="space-y-1.5 my-1.5 flex-1">
                      {/* Sáng */}
                      <div>
                        {hasMorning ? (
                          dayShifts.morning.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleOpenQuickConfirm(s)}
                              className={`w-full text-left p-1.5 rounded-lg border text-[11px] transition-all cursor-pointer mb-1 ${
                                s.status === 'completed'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                                  : 'bg-amber-50/90 border-amber-200 text-amber-900 font-semibold'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 truncate font-bold">
                                  <span>☀️</span> {s.staffName.split('(')[0].trim()}
                                </span>
                                <span className="font-mono text-[10px] shrink-0 font-bold">
                                  {s.actualHours !== undefined ? `${s.actualHours}h` : `${s.scheduledHours}h`}
                                </span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-1 rounded text-[10px] text-rose-500 bg-rose-50 border border-rose-100 font-medium">
                            ⚠️ Trống ca sáng
                          </div>
                        )}
                      </div>

                      {/* Chiều */}
                      <div>
                        {hasAfternoon ? (
                          dayShifts.afternoon.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleOpenQuickConfirm(s)}
                              className={`w-full text-left p-1.5 rounded-lg border text-[11px] transition-all cursor-pointer mb-1 ${
                                s.status === 'completed'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                                  : 'bg-indigo-50/90 border-indigo-200 text-indigo-900 font-semibold'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 truncate font-bold">
                                  <span>🌙</span> {s.staffName.split('(')[0].trim()}
                                </span>
                                <span className="font-mono text-[10px] shrink-0 font-bold">
                                  {s.actualHours !== undefined ? `${s.actualHours}h` : `${s.scheduledHours}h`}
                                </span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-1 rounded text-[10px] text-amber-600 bg-amber-50 border border-amber-100 font-medium">
                            ⚠️ Trống ca chiều
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-[9px] text-stone-400 text-right">
                      Nhấp ca để chốt giờ
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BẢNG CHẤM CÔNG & CHỐT LƯƠNG CUỐI THÁNG                            */}
      {/* ========================================================================= */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Tháng Đối Soát</span>
              <span className="text-xl font-black text-stone-900 font-mono mt-0.5 block">
                {selectedMonth}
              </span>
              <span className="text-[10px] text-stone-400 block mt-1">Đổi tháng ở thanh trên</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-emerald-600 uppercase font-bold block">Ca Đã Hoàn Thành</span>
              <span className="text-xl font-black text-emerald-700 font-mono mt-0.5 block">
                {totalMonthCompletedShifts} <span className="text-xs font-normal text-stone-500">ca</span>
              </span>
              <span className="text-[10px] text-stone-400 block mt-1">Đã chốt công thực tế</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-amber-700 uppercase font-bold block">Tổng Tiếng Thực Tế</span>
              <span className="text-xl font-black text-amber-800 font-mono mt-0.5 block">
                {Math.round(totalMonthActualHours * 10) / 10} <span className="text-xs font-normal text-stone-500">giờ</span>
              </span>
              <span className="text-[10px] text-stone-400 block mt-1">Toàn bộ nhân sự</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-purple-700 uppercase font-bold block">Tổng Quỹ Lương</span>
              <span className="text-xl font-black text-purple-900 font-mono mt-0.5 block">
                {formatCurrency(totalMonthPayrollAmount)}
              </span>
              <span className={`text-[10px] font-bold block mt-1 ${isMonthFinalized ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isMonthFinalized ? '✓ Đã chốt lương tháng' : '● Tạm tính theo số giờ'}
              </span>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Bảng Lương Tháng {selectedMonth} (Tính Theo Tiếng Làm Thực Tế)
              </h3>
              <span className="text-xs text-stone-400">
                Lương = Tổng Giờ Thực Tế × Đơn Giá/Giờ + Thưởng - Phạt
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3 pl-4">Nhân Viên</th>
                    <th className="p-3 text-center">Ca Xếp / Đã Chốt</th>
                    <th className="p-3 text-right">Tổng Giờ TT</th>
                    <th className="p-3 text-right">Lương / Giờ</th>
                    <th className="p-3 text-right">Lương Cơ Bản</th>
                    <th className="p-3 text-right">Thưởng / Phụ Cấp</th>
                    <th className="p-3 text-right">Giảm Trừ / Phạt</th>
                    <th className="p-3 text-right font-black">THỰC NHẬN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {payrollList.map((row) => (
                    <tr key={row.staffId} className="hover:bg-amber-50/30 transition-colors">
                      <td className="p-3 pl-4">
                        <div className="font-bold text-stone-900 text-sm">{row.staffName}</div>
                        <span className="text-[10px] text-stone-400 font-mono">ID: {row.staffId}</span>
                      </td>

                      <td className="p-3 text-center">
                        <span className="font-bold text-stone-800">{row.totalCompletedShifts}</span>
                        <span className="text-stone-400"> / {row.totalScheduledShifts} ca</span>
                      </td>

                      <td className="p-3 text-right font-mono font-black text-amber-800 text-sm">
                        {row.totalActualHours}h
                      </td>

                      <td className="p-3 text-right font-mono font-semibold text-stone-700">
                        {formatCurrency(row.hourlyRate)}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-stone-800">
                        {formatCurrency(row.baseSalary)}
                      </td>

                      <td className="p-3 text-right">
                        <input
                          type="number"
                          step="10000"
                          min="0"
                          value={row.allowance}
                          onChange={(e) =>
                            handleUpdateAdjustment(row.staffId, Number(e.target.value), undefined)
                          }
                          className="w-24 px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-right font-mono text-emerald-700 font-bold text-xs"
                        />
                      </td>

                      <td className="p-3 text-right">
                        <input
                          type="number"
                          step="10000"
                          min="0"
                          value={row.deduction}
                          onChange={(e) =>
                            handleUpdateAdjustment(row.staffId, undefined, Number(e.target.value))
                          }
                          className="w-24 px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-right font-mono text-rose-700 font-bold text-xs"
                        />
                      </td>

                      <td className="p-3 text-right font-mono font-black text-sm text-purple-900">
                        {formatCurrency(row.finalSalary)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: HỒ SƠ & MỨC LƯƠNG NHÂN VIÊN                                       */}
      {/* ========================================================================= */}
      {activeTab === 'accounts' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700">
              Danh sách nhân sự ({staffList.length} tài khoản)
            </span>
            <button
              type="button"
              onClick={handleOpenAddAccount}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Nhân Viên Mới</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 pl-5">Nhân Viên</th>
                  <th className="p-3.5">Tên Đăng Nhập</th>
                  <th className="p-3.5">Vai Trò</th>
                  <th className="p-3.5 text-right">Lương Theo Giờ</th>
                  <th className="p-3.5 text-center">Mã PIN</th>
                  <th className="p-3.5 text-center">Trạng Thái</th>
                  <th className="p-3.5 pr-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {staffList.map((staff) => {
                  const isOwner = staff.role === 'owner';
                  return (
                    <tr key={staff.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                          <span>{staff.name}</span>
                          {isOwner && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-extrabold uppercase">
                              Chủ Tiệm
                            </span>
                          )}
                        </div>
                        {staff.phone && (
                          <span className="text-[11px] text-stone-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {staff.phone}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 font-mono font-bold text-stone-800 text-xs">{staff.username}</td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isOwner
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : 'bg-sky-100 text-sky-900 border border-sky-300'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {isOwner ? 'Chủ Tiệm (Toàn Quyền)' : 'Thu Ngân POS'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-amber-800 text-sm">
                        {formatCurrency(staff.hourlyRate || (isOwner ? 50000 : 28000))} /h
                      </td>

                      <td className="p-3.5 text-center font-mono font-bold text-stone-700">
                        <span className="bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                          {staff.pinCode}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            staff.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {staff.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                        </span>
                      </td>

                      <td className="p-3.5 pr-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEditAccount(staff)}
                          className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHẤM CÔNG NHANH CUỐI NGÀY (CONFIRM SỐ GIỜ LÀM VIỆC)                */}
      {/* ========================================================================= */}
      {quickConfirmShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <CheckCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-stone-900">
                  Chốt Công Cuối Ngày Làm Việc
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickConfirmShift(null)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickConfirm} className="mt-4 space-y-4 text-xs">
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200/80 space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Nhân viên:</span>
                  <strong className="text-stone-900 font-bold">{quickConfirmShift.staffName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Ngày làm:</span>
                  <strong className="text-stone-800 font-mono">{quickConfirmShift.date}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Ca làm việc:</span>
                  <strong className="text-amber-900">{quickConfirmShift.shiftTitle}</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Xác nhận số giờ làm việc thực tế (giờ) <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={confirmHoursInput}
                  onChange={(e) => setConfirmHoursInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-black text-amber-800 text-base"
                  required
                />

                {/* Quick Presets */}
                <div className="flex gap-1.5 mt-2">
                  {[
                    { label: '8.0h (Đúng giờ)', val: 8.0 },
                    { label: '8.5h (+30p OT)', val: 8.5 },
                    { label: '9.0h (+1h OT)', val: 9.0 },
                    { label: '7.5h (Trễ 30p)', val: 7.5 },
                    { label: '0h (Nghỉ)', val: 0.0 },
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => setConfirmHoursInput(preset.val)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        confirmHoursInput === preset.val
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Ghi chú đối soát (nếu có):</label>
                <input
                  type="text"
                  value={confirmNotesInput}
                  onChange={(e) => setConfirmNotesInput(e.target.value)}
                  placeholder="VD: OT 30p làm bánh nướng, đến trễ 10p..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setQuickConfirmShift(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận & Lưu Công</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THÊM / SỬA TÀI KHOẢN NHÂN VIÊN                                     */}
      {/* ========================================================================= */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-600" />
              <span>{editingAccount ? 'Sửa Thông Tin Nhân Viên' : 'Thêm Nhân Viên Mới'}</span>
            </h3>

            {formError && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveAccount} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Tên Đăng Nhập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="VD: thungan3"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Họ Và Tên Nhân Viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Nguyễn Thị Lan"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Số Điện Thoại</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Mức Lương / Giờ (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="15000"
                    value={formHourlyRate}
                    onChange={(e) => setFormHourlyRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-amber-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Vai Trò (Role)</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as AdminRole)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  >
                    <option value="cashier">Thu Ngân (Cashier)</option>
                    <option value="owner">Chủ Tiệm (Owner)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Mã PIN Đăng Nhập</label>
                  <input
                    type="text"
                    value={formPinCode}
                    onChange={(e) => setFormPinCode(e.target.value)}
                    placeholder="VD: 123456"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-stone-300 text-amber-600"
                />
                <label htmlFor="isActiveCheck" className="text-stone-700 cursor-pointer">
                  Kích hoạt tài khoản này ngay
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm"
                >
                  Lưu Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
