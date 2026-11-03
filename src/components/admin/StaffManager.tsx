import React, { useState, useMemo, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Clock,
  Lock,
} from 'lucide-react';
import { mockDb } from '../../services/mockDb';
import type { AdminRole, StaffAccount } from '../../types';

const SHIFT_OPTIONS = [
  'Ca Sáng (06:30 - 14:30)',
  'Ca Chiều (14:30 - 22:30)',
  'Ca Tối (18:00 - 23:00)',
  'Toàn Thời Gian (Quản Trị)',
];

export const StaffManager: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffAccount[]>(() => mockDb.getStaffAccounts());
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<AdminRole>('cashier');
  const [formPhone, setFormPhone] = useState('');
  const [formShift, setFormShift] = useState(SHIFT_OPTIONS[0]);
  const [formPinCode, setFormPinCode] = useState('123456');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Lắng nghe realtime cập nhật tài khoản
  useEffect(() => {
    const handleUpdate = () => {
      setStaffList(mockDb.getStaffAccounts());
    };
    window.addEventListener('bake_sip_staff_updated', handleUpdate);
    return () => {
      window.removeEventListener('bake_sip_staff_updated', handleUpdate);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchSearch =
        !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.phone && s.phone.includes(searchQuery.trim()));
      return matchSearch;
    });
  }, [staffList, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormUsername('');
    setFormName('');
    setFormRole('cashier');
    setFormPhone('');
    setFormShift(SHIFT_OPTIONS[0]);
    setFormPinCode('123456');
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffAccount) => {
    setEditingStaff(staff);
    setFormUsername(staff.username);
    setFormName(staff.name);
    setFormRole(staff.role);
    setFormPhone(staff.phone || '');
    setFormShift(staff.shift || SHIFT_OPTIONS[0]);
    setFormPinCode(staff.pinCode);
    setFormIsActive(staff.isActive);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formUsername.trim()) {
      setFormError('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (!formName.trim()) {
      setFormError('Vui lòng nhập họ tên nhân viên.');
      return;
    }
    if (!formPinCode.trim()) {
      setFormError('Vui lòng nhập mã PIN/mật khẩu đăng nhập.');
      return;
    }

    try {
      if (editingStaff) {
        mockDb.updateStaffAccount(editingStaff.id, {
          username: formUsername.trim().toLowerCase(),
          name: formName.trim(),
          role: formRole,
          phone: formPhone.trim() || undefined,
          shift: formShift,
          pinCode: formPinCode.trim(),
          isActive: formIsActive,
        });
        showToast(`Đã cập nhật tài khoản "${formName}" thành công!`);
      } else {
        mockDb.addStaffAccount({
          username: formUsername.trim().toLowerCase(),
          name: formName.trim(),
          role: formRole,
          phone: formPhone.trim() || undefined,
          shift: formShift,
          pinCode: formPinCode.trim(),
          isActive: formIsActive,
        });
        showToast(`Đã thêm nhân viên thu ngân "${formName}" vào hệ thống!`);
      }

      setStaffList(mockDb.getStaffAccounts());
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu tài khoản';
      setFormError(msg);
    }
  };

  const handleToggleStatus = (staff: StaffAccount) => {
    try {
      const updated = mockDb.toggleStaffStatus(staff.id);
      setStaffList(mockDb.getStaffAccounts());
      showToast(
        updated.isActive
          ? `Tài khoản "${staff.name}" đã được kích hoạt lại.`
          : `Đã tạm khóa tài khoản "${staff.name}".`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi';
      alert(msg);
    }
  };

  const handleDeleteStaff = (staff: StaffAccount) => {
    if (staff.username === 'admin') {
      alert('Không thể xóa tài khoản Chủ Tiệm (Admin chính).');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản của nhân viên "${staff.name}"?`)) {
      mockDb.deleteStaffAccount(staff.id);
      setStaffList(mockDb.getStaffAccounts());
      showToast(`Đã xóa tài khoản "${staff.name}".`);
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

      {/* Header & Add Button */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="font-serif font-extrabold text-stone-900 text-lg sm:text-xl">
              Quản Lý Tài Khoản Thu Ngân & Nhân Viên
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Chỉ Chủ Tiệm mới có quyền phân quyền ca trực, tạo tài khoản và đặt mã PIN cho thu ngân
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/25 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thêm Tài Khoản Thu Ngân</span>
        </button>
      </div>

      {/* Danh sách tài khoản nhân viên */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <span className="text-xs font-bold text-stone-700">
            Danh sách nhân viên ({staffList.length} tài khoản)
          </span>

          <input
            type="text"
            placeholder="Tìm theo tên hoặc username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 w-64 focus:outline-none focus:border-amber-600"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5 pl-5">Nhân Viên</th>
                <th className="p-3.5">Tên Đăng Nhập</th>
                <th className="p-3.5">Vai Trò (Role)</th>
                <th className="p-3.5">Ca Trực</th>
                <th className="p-3.5">Mã PIN</th>
                <th className="p-3.5 text-center">Trạng Thái</th>
                <th className="p-3.5 pr-5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredStaff.map((staff) => {
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

                    <td className="p-3.5 font-mono font-bold text-stone-800 text-xs">
                      {staff.username}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isOwner
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : 'bg-sky-100 text-sky-900 border border-sky-300'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {isOwner ? 'Toàn Quyền Quản Trị' : 'Thu Ngân POS'}
                      </span>
                    </td>

                    <td className="p-3.5 text-stone-600 text-xs flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{staff.shift}</span>
                    </td>

                    <td className="p-3.5 font-mono font-bold text-stone-700">
                      <span className="bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                        {staff.pinCode}
                      </span>
                    </td>

                    {/* Toggle Status */}
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(staff)}
                        disabled={isOwner}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                          staff.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                        } ${isOwner ? 'opacity-80 cursor-default' : ''}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            staff.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span>{staff.isActive ? 'Đang Hoạt Động' : 'Tạm Khóa'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(staff)}
                          className="p-1.5 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200 transition-colors cursor-pointer"
                          title="Chỉnh sửa tài khoản"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {!isOwner && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(staff)}
                            className="p-1.5 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-400 hover:text-rose-700 border border-stone-200 transition-colors cursor-pointer"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL THÊM / SỬA TÀI KHOẢN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-stone-950/75 backdrop-blur-xs transition-opacity"
          />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl p-5 sm:p-6 space-y-4 animate-fade-in my-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">
                    {editingStaff ? `Sửa Tài Khoản: ${editingStaff.name}` : 'Tạo Tài Khoản Thu Ngân Mới'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStaff} className="space-y-3.5 text-xs">
                {formError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Họ và Tên Nhân Viên *</label>
                  <input
                    type="text"
                    placeholder="VD: Trần Thị Thu Ngân..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">Tên Đăng Nhập (Username) *</label>
                    <input
                      type="text"
                      placeholder="VD: thungan_sang..."
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-stone-400" />
                      <span>Mã PIN / Mật Khẩu *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 123456..."
                      value={formPinCode}
                      onChange={(e) => setFormPinCode(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">Vai Trò Phân Quyền</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as AdminRole)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-600"
                    >
                      <option value="cashier">Thu Ngân (Chỉ Bán Hàng & Đơn)</option>
                      <option value="owner">Chủ Tiệm (Toàn Quyền)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">Số Điện Thoại</label>
                    <input
                      type="tel"
                      placeholder="VD: 0988..."
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Ca Làm Việc Phân Công</label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-600"
                  >
                    {SHIFT_OPTIONS.map((sh) => (
                      <option key={sh} value={sh}>
                        {sh}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 border border-stone-300 rounded-xl font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-xl font-bold shadow-md cursor-pointer transition-all"
                  >
                    {editingStaff ? 'Lưu Cập Nhật' : 'Tạo Tài Khoản'}
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
