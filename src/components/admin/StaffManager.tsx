import React, { useState, useMemo, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Shield,
  CheckCircle2,
  Phone,
  Clock,
  Calendar,
  DollarSign,
  Lock,
} from 'lucide-react';
import { mockDb } from '../../services/mockDb';
import type { AdminRole, MonthlyPayrollSummary, StaffAccount, WorkShift, WorkShiftStatus } from '../../types';
import { calculateHoursBetween, formatCurrency } from '../../utils/format';
import { CashierScheduleView } from './CashierScheduleView';

const SHIFT_TEMPLATES = [
  { title: 'Ca Sáng (06:30 - 14:30)', start: '06:30', end: '14:30', hours: 8.0 },
  { title: 'Ca Chiều (14:30 - 22:30)', start: '14:30', end: '22:30', hours: 8.0 },
  { title: 'Ca Tối Tăng Cường (18:00 - 22:30)', start: '18:00', end: '22:30', hours: 4.5 },
  { title: 'Ca Bếp Sáng (05:30 - 11:30)', start: '05:30', end: '11:30', hours: 6.0 },
  { title: 'Ca Part-time 5h (09:00 - 14:00)', start: '09:00', end: '14:00', hours: 5.0 },
];

interface StaffManagerProps {
  currentStaff?: StaffAccount;
  userRole?: AdminRole;
}

export const StaffManager: React.FC<StaffManagerProps> = ({
  currentStaff,
  userRole = currentStaff?.role || 'owner',
}) => {
  // If the user is a cashier, show the dedicated Cashier Schedule View
  if (userRole === 'cashier' && currentStaff) {
    return <CashierScheduleView currentStaff={currentStaff} />;
  }

  // --- OWNER MANAGEMENT PORTAL ---
  const [activeTab, setActiveTab] = useState<'roster' | 'payroll' | 'accounts'>('roster');
  const [staffList, setStaffList] = useState<StaffAccount[]>(() => mockDb.getStaffAccounts());
  const [workShifts, setWorkShifts] = useState<WorkShift[]>(() => mockDb.getWorkShifts());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Month selector for Timesheet / Payroll
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [payrollList, setPayrollList] = useState<MonthlyPayrollSummary[]>([]);

  // Roster Filter & View
  const [rosterStaffFilter, setRosterStaffFilter] = useState<string>('ALL');
  const [rosterDateFilter, setRosterDateFilter] = useState<string>('');

  // Modals
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
  const [isEditActualModalOpen, setIsEditActualModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isShiftHistoryModalOpen, setIsShiftHistoryModalOpen] = useState(false);
  const [selectedStaffForHistory, setSelectedStaffForHistory] = useState<StaffAccount | null>(null);

  // Add Shift Form State
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [shiftDate, setShiftDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [shiftTemplateIndex, setShiftTemplateIndex] = useState<number>(0);
  const [shiftTitle, setShiftTitle] = useState<string>(SHIFT_TEMPLATES[0].title);
  const [shiftStartTime, setShiftStartTime] = useState<string>(SHIFT_TEMPLATES[0].start);
  const [shiftEndTime, setShiftEndTime] = useState<string>(SHIFT_TEMPLATES[0].end);
  const [shiftNotes, setShiftNotes] = useState<string>('');

  // Edit Actual Hours Form State
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const [actualStartTimeInput, setActualStartTimeInput] = useState<string>('');
  const [actualEndTimeInput, setActualEndTimeInput] = useState<string>('');
  const [actualHoursInput, setActualHoursInput] = useState<number>(8.0);
  const [actualStatusInput, setActualStatusInput] = useState<WorkShiftStatus>('completed');
  const [actualNotesInput, setActualNotesInput] = useState<string>('');

  // Account Form State
  const [editingAccount, setEditingAccount] = useState<StaffAccount | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<AdminRole>('cashier');
  const [formPhone, setFormPhone] = useState('');
  const [formHourlyRate, setFormHourlyRate] = useState<number>(28000);
  const [formPinCode, setFormPinCode] = useState('123456');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Reload data
  const loadData = () => {
    setStaffList(mockDb.getStaffAccounts());
    setWorkShifts(mockDb.getWorkShifts());
    setPayrollList(mockDb.getMonthlyPayroll(selectedMonth));
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

  // Filtered Roster Shifts
  const filteredRosterShifts = useMemo(() => {
    return workShifts.filter((s) => {
      const matchStaff = rosterStaffFilter === 'ALL' || s.staffId === rosterStaffFilter;
      const matchDate = !rosterDateFilter || s.date === rosterDateFilter;
      return matchStaff && matchDate;
    });
  }, [workShifts, rosterStaffFilter, rosterDateFilter]);

  // Handle Template Select
  const handleSelectTemplate = (idx: number) => {
    setShiftTemplateIndex(idx);
    if (idx >= 0 && idx < SHIFT_TEMPLATES.length) {
      const t = SHIFT_TEMPLATES[idx];
      setShiftTitle(t.title);
      setShiftStartTime(t.start);
      setShiftEndTime(t.end);
    }
  };

  // Open Add Shift Modal
  const handleOpenAddShift = () => {
    const firstCashier = staffList.find((s) => s.role === 'cashier') || staffList[0];
    setSelectedStaffId(firstCashier ? firstCashier.id : '');
    setShiftDate(new Date().toISOString().slice(0, 10));
    handleSelectTemplate(0);
    setShiftNotes('');
    setIsAddShiftModalOpen(true);
  };

  // Save New Shift
  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffList.find((s) => s.id === selectedStaffId);
    if (!staff) {
      alert('Vui lòng chọn nhân viên được phân công');
      return;
    }

    const hours = calculateHoursBetween(shiftStartTime, shiftEndTime);

    try {
      mockDb.addWorkShift({
        staffId: staff.id,
        staffName: staff.name,
        staffRole: staff.role,
        date: shiftDate,
        shiftTitle: shiftTitle.trim(),
        scheduledStartTime: shiftStartTime,
        scheduledEndTime: shiftEndTime,
        scheduledHours: hours,
        status: 'scheduled',
        notes: shiftNotes.trim() || undefined,
      });

      showToast(`Đã xếp ca thành công cho ${staff.name} vào ngày ${shiftDate}!`);
      setIsAddShiftModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu ca làm việc');
    }
  };

  // Open Edit Actual / Attendance Modal
  const handleOpenEditActual = (shift: WorkShift) => {
    setEditingShift(shift);
    setActualStartTimeInput(shift.actualStartTime || shift.scheduledStartTime);
    setActualEndTimeInput(shift.actualEndTime || shift.scheduledEndTime);
    setActualHoursInput(shift.actualHours !== undefined ? shift.actualHours : shift.scheduledHours);
    setActualStatusInput(shift.status);
    setActualNotesInput(shift.actualNotes || '');
    setIsEditActualModalOpen(true);
  };

  // Save Actual Attendance
  const handleSaveActualAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;

    let computedHours = actualHoursInput;
    if (actualStatusInput === 'leave_excused' || actualStatusInput === 'leave_unexcused') {
      computedHours = 0;
    }

    try {
      mockDb.updateWorkShift(editingShift.id, {
        actualStartTime: actualStartTimeInput || undefined,
        actualEndTime: actualEndTimeInput || undefined,
        actualHours: Number(computedHours),
        status: actualStatusInput,
        actualNotes: actualNotesInput.trim() || undefined,
      });

      showToast(`Đã cập nhật giờ làm thực tế của ca #${editingShift.shiftCode}!`);
      setIsEditActualModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật chấm công');
    }
  };

  // Delete Shift
  const handleDeleteShift = (shift: WorkShift) => {
    if (confirm(`Bạn có chắc chắn muốn xóa ca làm việc ${shift.shiftTitle} ngày ${shift.date}?`)) {
      mockDb.deleteWorkShift(shift.id);
      showToast('Đã xóa ca làm việc.');
      loadData();
    }
  };

  // Finalize Monthly Payroll
  const handleFinalizePayroll = () => {
    if (confirm(`Bạn có chắc chắn muốn CHỐT BẢNG LƯƠNG tháng ${selectedMonth}? Sau khi chốt, số tiếng làm việc sẽ được lưu chính thức để chi trả lương.`)) {
      mockDb.finalizeMonthlyPayroll(selectedMonth, currentStaff?.name || 'Nguyễn Văn Minh (Chủ Tiệm)');
      showToast(`✓ Đã chốt bảng công & quỹ lương tháng ${selectedMonth} thành công!`);
      loadData();
    }
  };

  // Update Payroll Adjustments (Thưởng/Phạt)
  const handleUpdatePayrollAdjustments = (staffId: string, allowance: number, deduction: number) => {
    mockDb.savePayrollAdjustments(selectedMonth, staffId, { allowance, deduction });
    loadData();
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

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formUsername.trim()) return setFormError('Vui lòng nhập tên đăng nhập.');
    if (!formName.trim()) return setFormError('Vui lòng nhập họ tên.');

    try {
      if (editingAccount) {
        mockDb.updateStaffAccount(editingAccount.id, {
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
        mockDb.addStaffAccount({
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
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu tài khoản');
    }
  };

  const handleToggleAccountStatus = (staff: StaffAccount) => {
    try {
      mockDb.toggleStaffStatus(staff.id);
      showToast(`Đã cập nhật trạng thái tài khoản "${staff.name}".`);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAccount = (staff: StaffAccount) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${staff.name}"?`)) {
      try {
        mockDb.deleteStaffAccount(staff.id);
        showToast(`Đã xóa tài khoản "${staff.name}".`);
        loadData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  // Helper status badge
  const getShiftBadge = (s: WorkShift) => {
    switch (s.status) {
      case 'in_progress':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] animate-pulse">
            🟢 Đang làm
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
            ✓ Đã xong ({s.actualHours !== undefined ? s.actualHours : s.scheduledHours}h)
          </span>
        );
      case 'leave_excused':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
            ⚠️ Nghỉ phép
          </span>
        );
      case 'leave_unexcused':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
            ❌ Không phép
          </span>
        );
      case 'swapped':
        return (
          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
            🔄 Đã đổi ca
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
            📅 Sắp tới
          </span>
        );
    }
  };

  // Calculate monthly stats
  const totalMonthCompletedShifts = payrollList.reduce((sum, p) => sum + p.totalCompletedShifts, 0);
  const totalMonthActualHours = payrollList.reduce((sum, p) => sum + p.totalActualHours, 0);
  const totalMonthPayrollAmount = payrollList.reduce((sum, p) => sum + p.finalSalary, 0);
  const isMonthFinalized = payrollList.length > 0 && payrollList.every((p) => p.isFinalized);

  return (
    <div className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-6 font-sans animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-amber-300 px-4 py-3 rounded-2xl shadow-xl border border-stone-700 flex items-center gap-2 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="font-serif font-extrabold text-stone-900 text-lg sm:text-xl">
              Phân Ca Linh Hoạt, Chấm Công & Quản Lý Nhân Sự
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Sắp xếp lịch làm việc linh hoạt theo ngày/tuần, ghi nhận giờ làm thực tế và chốt số tiếng tính lương cuối tháng
          </p>
        </div>

        {/* Action Button depending on tab */}
        <div className="flex items-center gap-2">
          {activeTab === 'roster' && (
            <button
              type="button"
              onClick={handleOpenAddShift}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Xếp Ca Cho Nhân Viên</span>
            </button>
          )}

          {activeTab === 'payroll' && (
            <button
              type="button"
              onClick={handleFinalizePayroll}
              disabled={isMonthFinalized}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                isMonthFinalized
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>{isMonthFinalized ? 'Đã Chốt Bảng Lương Tháng' : 'Chốt Bảng Lương Tháng Này'}</span>
            </button>
          )}

          {activeTab === 'accounts' && (
            <button
              type="button"
              onClick={handleOpenAddAccount}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Nhân Viên Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Lịch Phân Ca & Chấm Công Thực Tế</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">{workShifts.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payroll')}
          className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'payroll'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Bảng Chấm Công & Chốt Lương Tháng</span>
          {isMonthFinalized && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-400 text-stone-900 font-bold">
              Đã Chốt
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'accounts'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Hồ Sơ & Mức Lương Nhân Viên</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-700">
            {staffList.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: LỊCH PHÂN CA & CHẤM CÔNG THỰC TẾ (SHIFT ROSTER)    */}
      {/* ======================================================== */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="font-bold text-stone-600 block mb-1">Lọc theo nhân viên:</label>
                <select
                  value={rosterStaffFilter}
                  onChange={(e) => setRosterStaffFilter(e.target.value)}
                  className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-800"
                >
                  <option value="ALL">Tất cả nhân viên ({staffList.length})</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role === 'owner' ? 'Chủ tiệm' : 'Thu ngân'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-600 block mb-1">Lọc theo ngày cụ thể:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={rosterDateFilter}
                    onChange={(e) => setRosterDateFilter(e.target.value)}
                    className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl font-mono text-stone-800"
                  />
                  {rosterDateFilter && (
                    <button
                      type="button"
                      onClick={() => setRosterDateFilter('')}
                      className="text-stone-400 hover:text-stone-700 p-1"
                      title="Bỏ lọc ngày"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRosterDateFilter(new Date().toISOString().slice(0, 10))}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-bold border border-amber-200 transition-colors"
              >
                Hôm Nay ({new Date().toLocaleDateString('vi-VN')})
              </button>
            </div>
          </div>

          {/* List of Shifts */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700">
                Lịch làm việc ({filteredRosterShifts.length} ca trực)
              </span>
              <span className="text-[11px] text-stone-400">
                Nhấp vào từng ca để chấm công thực tế hoặc ghi nhận nghỉ đột xuất
              </span>
            </div>

            {filteredRosterShifts.length === 0 ? (
              <div className="p-12 text-center text-xs text-stone-400">
                Không tìm thấy ca làm việc nào phù hợp với bộ lọc.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {filteredRosterShifts.map((shift) => {
                  const isToday = shift.date === new Date().toISOString().slice(0, 10);

                  return (
                    <div
                      key={shift.id}
                      className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                        shift.status === 'in_progress'
                          ? 'bg-emerald-50/40'
                          : isToday
                          ? 'bg-amber-50/20'
                          : 'hover:bg-stone-50/60'
                      }`}
                    >
                      {/* Left: Info */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                            {shift.date}
                          </span>
                          <span className="text-xs font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md">
                            {shift.staffName}
                          </span>
                          {getShiftBadge(shift)}
                        </div>

                        <div className="text-sm font-black text-stone-800">{shift.shiftTitle}</div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            Dự kiến: {shift.scheduledStartTime} - {shift.scheduledEndTime} ({shift.scheduledHours}h)
                          </span>
                          {shift.actualStartTime && (
                            <span className="text-emerald-700 font-semibold font-mono">
                              • Thực tế: {shift.actualStartTime} {shift.actualEndTime ? `- ${shift.actualEndTime}` : '(Đang làm)'}{' '}
                              ({shift.actualHours !== undefined ? shift.actualHours : shift.scheduledHours} tiếng)
                            </span>
                          )}
                        </div>

                        {shift.notes && (
                          <div className="text-[11px] text-stone-600 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/80 inline-block mt-1">
                            <strong>Phân công:</strong> {shift.notes}
                          </div>
                        )}

                        {shift.actualNotes && (
                          <div className="text-[11px] text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80 inline-block mt-1 ml-1">
                            <strong>Chấm công:</strong> {shift.actualNotes}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                        <button
                          type="button"
                          onClick={() => handleOpenEditActual(shift)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Chấm Công / Sửa Giờ
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteShift(shift)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Xóa ca"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: BẢNG CHẤM CÔNG & CHỐT LƯƠNG THÁNG (MONTHLY PAYROLL) */}
      {/* ======================================================== */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          {/* Monthly Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Tháng Đối Soát</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-lg font-black text-stone-900 font-mono mt-0.5 border-none outline-none cursor-pointer"
              />
              <span className="text-[10px] text-stone-400 block mt-1">Chọn tháng để xem bảng công</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-emerald-600 uppercase font-bold block">Ca Đã Hoàn Thành</span>
              <span className="text-xl font-black text-emerald-700 font-mono mt-0.5 block">
                {totalMonthCompletedShifts} <span className="text-xs font-normal text-stone-500">ca</span>
              </span>
              <span className="text-[10px] text-stone-400 block mt-1">Từ các ca đã làm thực tế</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-amber-700 uppercase font-bold block">Tổng Tiếng Thực Tế</span>
              <span className="text-xl font-black text-amber-800 font-mono mt-0.5 block">
                {Math.round(totalMonthActualHours * 10) / 10} <span className="text-xs font-normal text-stone-500">giờ</span>
              </span>
              <span className="text-[10px] text-stone-400 block mt-1">Toàn bộ nhân viên quán</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-purple-700 uppercase font-bold block">Quỹ Lương Dự Kiến</span>
              <span className="text-xl font-black text-purple-900 font-mono mt-0.5 block">
                {formatCurrency(totalMonthPayrollAmount)}
              </span>
              <span className={`text-[10px] font-bold block mt-1 ${isMonthFinalized ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isMonthFinalized ? '✓ Đã chốt bảng lương' : '● Tạm tính theo giờ'}
              </span>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Bảng Tính Tiền Lương Theo Tiếng Làm Việc (Tháng {selectedMonth})
              </h3>
              <span className="text-xs text-stone-400">
                Công thức: Tổng Giờ Thực Tế × Lương Theo Giờ + Thưởng - Phạt
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3 pl-4">Nhân Viên</th>
                    <th className="p-3 text-center">Ca Xếp / Đã Làm</th>
                    <th className="p-3 text-center">Nghỉ Phép</th>
                    <th className="p-3 text-right">Tổng Giờ TT</th>
                    <th className="p-3 text-right">Mức Lương / Giờ</th>
                    <th className="p-3 text-right">Lương Cơ Bản</th>
                    <th className="p-3 text-right">Thưởng / Phụ Cấp</th>
                    <th className="p-3 text-right">Giảm Trừ / Phạt</th>
                    <th className="p-3 text-right font-black">THỰC NHẬN</th>
                    <th className="p-3 pr-4 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {payrollList.map((row) => {
                    return (
                      <tr key={row.staffId} className="hover:bg-amber-50/30 transition-colors">
                        <td className="p-3 pl-4">
                          <div className="font-bold text-stone-900 text-sm">{row.staffName}</div>
                          <span className="text-[10px] text-stone-400 font-mono">ID: {row.staffId}</span>
                        </td>

                        <td className="p-3 text-center">
                          <span className="font-bold text-stone-800">{row.totalCompletedShifts}</span>
                          <span className="text-stone-400"> / {row.totalScheduledShifts} ca</span>
                        </td>

                        <td className="p-3 text-center">
                          {row.totalLeaveShifts > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                              {row.totalLeaveShifts} ca
                            </span>
                          ) : (
                            <span className="text-stone-400">0</span>
                          )}
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
                            disabled={row.isFinalized}
                            value={row.allowance}
                            onChange={(e) =>
                              handleUpdatePayrollAdjustments(row.staffId, Number(e.target.value), row.deduction)
                            }
                            className="w-24 px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-right font-mono text-emerald-700 font-bold text-xs"
                          />
                        </td>

                        <td className="p-3 text-right">
                          <input
                            type="number"
                            step="10000"
                            min="0"
                            disabled={row.isFinalized}
                            value={row.deduction}
                            onChange={(e) =>
                              handleUpdatePayrollAdjustments(row.staffId, row.allowance, Number(e.target.value))
                            }
                            className="w-24 px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-right font-mono text-rose-700 font-bold text-xs"
                          />
                        </td>

                        <td className="p-3 text-right font-mono font-black text-sm text-purple-900">
                          {formatCurrency(row.finalSalary)}
                        </td>

                        <td className="p-3 pr-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const staff = staffList.find((s) => s.id === row.staffId);
                              if (staff) {
                                setSelectedStaffForHistory(staff);
                                setIsShiftHistoryModalOpen(true);
                              }
                            }}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Xem Chi Tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: HỒ SƠ & TÀI KHOẢN NHÂN VIÊN (STAFF ACCOUNTS)     */}
      {/* ======================================================== */}
      {activeTab === 'accounts' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700">
              Danh sách nhân viên ({staffList.length} tài khoản)
            </span>
            <span className="text-[11px] text-stone-400">
              Chủ tiệm có thể sửa mức lương / giờ và mã PIN của nhân viên tại đây
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 pl-5">Nhân Viên</th>
                  <th className="p-3.5">Tên Đăng Nhập</th>
                  <th className="p-3.5">Vai Trò</th>
                  <th className="p-3.5 text-right">Lương / Giờ</th>
                  <th className="p-3.5 text-center">Mã PIN</th>
                  <th className="p-3.5 text-center">Trạng Thái</th>
                  <th className="p-3.5 pr-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {staffList.map((staff) => {
                  const isOwner = staff.role === 'owner';
                  return (
                    <tr
                      key={staff.id}
                      className={`hover:bg-amber-50/40 transition-colors ${
                        !staff.isActive ? 'opacity-60 bg-stone-50' : ''
                      }`}
                    >
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
                        <button
                          type="button"
                          onClick={() => handleToggleAccountStatus(staff)}
                          disabled={isOwner}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                            staff.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-rose-100 hover:text-rose-800'
                              : 'bg-stone-200 text-stone-600 border border-stone-300 hover:bg-emerald-100 hover:text-emerald-800'
                          }`}
                        >
                          {staff.isActive ? 'Đang hoạt động' : 'Đã tạm khóa'}
                        </button>
                      </td>

                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditAccount(staff)}
                            className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Sửa thông tin"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {!isOwner && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAccount(staff)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa nhân viên"
                            >
                              <Trash2 className="w-4 h-4" />
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
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: XẾP CA LÀM VIỆC MỚI                            */}
      {/* ======================================================== */}
      {isAddShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-stone-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                <span>Xếp Ca Làm Việc Mới Cho Nhân Viên</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddShiftModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Chọn nhân viên được phân công <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900"
                  required
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role === 'owner' ? 'Chủ tiệm' : 'Thu ngân'} • Lương {formatCurrency(s.hourlyRate || 28000)}/h)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Ngày làm việc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Chọn mẫu ca nhanh:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SHIFT_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectTemplate(idx)}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        shiftTemplateIndex === idx
                          ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="font-bold text-[11px] truncate">{tmpl.title}</div>
                      <div className="text-[10px] text-stone-400 font-mono">
                        {tmpl.start} - {tmpl.end} ({tmpl.hours}h)
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Giờ bắt đầu dự kiến</label>
                  <input
                    type="time"
                    value={shiftStartTime}
                    onChange={(e) => setShiftStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Giờ kết thúc dự kiến</label>
                  <input
                    type="time"
                    value={shiftEndTime}
                    onChange={(e) => setShiftEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <span className="text-amber-800 font-medium">Số tiếng dự kiến tự động:</span>
                <span className="font-mono font-black text-amber-900 text-sm">
                  {calculateHoursBetween(shiftStartTime, shiftEndTime)} tiếng
                </span>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Ghi chú phân công nhiệm vụ</label>
                <textarea
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  placeholder="Ví dụ: Phụ trách quầy bánh, bàn giao két trước 14:30..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddShiftModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm"
                >
                  Xác Nhận Xếp Ca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CHẤM CÔNG THỰC TẾ & GHI NHẬN NGHỈ ĐỘT XUẤT     */}
      {/* ======================================================== */}
      {isEditActualModalOpen && editingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span>Chấm Công & Ghi Nhận Giờ Thực Tế</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Nhân viên: <strong className="text-stone-800">{editingShift.staffName}</strong> • Ngày {editingShift.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditActualModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveActualAttendance} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Trạng thái ca làm việc:</label>
                <select
                  value={actualStatusInput}
                  onChange={(e) => setActualStatusInput(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                >
                  <option value="completed">✓ Đã Hoàn Thành (Tính công)</option>
                  <option value="in_progress">🟢 Đang Làm Việc</option>
                  <option value="scheduled">📅 Sắp Tới (Chờ vào ca)</option>
                  <option value="leave_excused">⚠️ Nghỉ Có Phép / Xin Nghỉ Đột Xuất (0 công)</option>
                  <option value="leave_unexcused">❌ Nghỉ Không Phép (0 công)</option>
                  <option value="swapped">🔄 Đã Đổi Ca Cho Người Khác</option>
                </select>
              </div>

              {actualStatusInput !== 'leave_excused' && actualStatusInput !== 'leave_unexcused' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Giờ vào thực tế:</label>
                      <input
                        type="time"
                        value={actualStartTimeInput}
                        onChange={(e) => {
                          setActualStartTimeInput(e.target.value);
                          if (actualEndTimeInput) {
                            setActualHoursInput(calculateHoursBetween(e.target.value, actualEndTimeInput));
                          }
                        }}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Giờ ra thực tế:</label>
                      <input
                        type="time"
                        value={actualEndTimeInput}
                        onChange={(e) => {
                          setActualEndTimeInput(e.target.value);
                          if (actualStartTimeInput) {
                            setActualHoursInput(calculateHoursBetween(actualStartTimeInput, e.target.value));
                          }
                        }}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Tổng số tiếng làm việc thực tế (giờ):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={actualHoursInput}
                      onChange={(e) => setActualHoursInput(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-black text-amber-800 text-sm"
                      required
                    />
                    <p className="text-[10px] text-stone-400 mt-1">
                      Tự động tính từ giờ vào - ra, bạn có thể chỉnh tay nếu có OT hoặc bù giờ.
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Ghi chú chấm công / lý do nghỉ hoặc OT:
                </label>
                <textarea
                  value={actualNotesInput}
                  onChange={(e) => setActualNotesInput(e.target.value)}
                  placeholder="Ví dụ: OT thêm 30p làm bánh nướng, đến trễ 10p do kẹt xe..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsEditActualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm"
                >
                  Lưu Chấm Công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: XEM CHI TIẾT TỪNG CA CỦA NHÂN VIÊN TRONG THÁNG */}
      {/* ======================================================== */}
      {isShiftHistoryModalOpen && selectedStaffForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Chi Tiết Bảng Công: {selectedStaffForHistory.name}
                </h3>
                <p className="text-xs text-stone-500">
                  Đối soát giờ làm thực tế trong tháng {selectedMonth}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsShiftHistoryModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {workShifts
                .filter((s) => s.staffId === selectedStaffForHistory.id && s.date.startsWith(selectedMonth))
                .map((shift) => (
                  <div
                    key={shift.id}
                    className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900">{shift.date}</span>
                        <span className="font-bold text-stone-800">{shift.shiftTitle}</span>
                        {getShiftBadge(shift)}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        Dự kiến: {shift.scheduledStartTime} - {shift.scheduledEndTime}
                        {shift.actualStartTime && (
                          <span className="text-emerald-700 font-semibold ml-2">
                            Thực tế: {shift.actualStartTime} - {shift.actualEndTime}
                          </span>
                        )}
                      </div>
                      {shift.actualNotes && (
                        <div className="text-[10px] text-amber-800 italic mt-0.5">
                          Note: {shift.actualNotes}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-amber-800 text-sm">
                        {shift.actualHours !== undefined ? shift.actualHours : shift.scheduledHours}h
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {formatCurrency(
                          (shift.actualHours !== undefined ? shift.actualHours : shift.scheduledHours) *
                            (selectedStaffForHistory.hourlyRate || 28000)
                        )}
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setIsShiftHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: THÊM / SỬA TÀI KHOẢN NHÂN VIÊN & MỨC LƯƠNG     */}
      {/* ======================================================== */}
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
