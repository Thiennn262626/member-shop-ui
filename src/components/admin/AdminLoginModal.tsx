import React, { useState } from 'react';
import {
  Lock,
  User,
  Store,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  X,
  KeyRound,
} from 'lucide-react';
import { mockDb, SHOP_CONFIG } from '../../services/mockDb';
import type { AdminUserData } from '../../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AdminUserData) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      try {
        const staff = mockDb.authenticateStaff(username, password);
        if (staff) {
          const userData: AdminUserData = {
            id: staff.id,
            username: staff.username,
            name: staff.name,
            role: staff.role,
            roleTitle: staff.role === 'owner' ? 'Chủ Tiệm (Toàn Quyền)' : 'Thu Ngân Ca Trực',
            shift: staff.shift,
          };
          sessionStorage.setItem('bake_sip_admin_user', JSON.stringify(userData));
          setIsLoading(false);
          onLoginSuccess(userData);
        } else {
          setIsLoading(false);
          setErrorMsg('Tên đăng nhập hoặc mật khẩu/PIN không đúng. Vui lòng thử lại!');
        }
      } catch (err: unknown) {
        setIsLoading(false);
        const msg = err instanceof Error ? err.message : 'Lỗi xác thực';
        setErrorMsg(msg);
      }
    }, 300);
  };

  const handleQuickLogin = (userType: 'admin' | 'thungan') => {
    const targetUser = userType === 'admin' ? 'admin' : 'thungan';
    setUsername(targetUser);
    setPassword('123456');
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      try {
        const staff = mockDb.authenticateStaff(targetUser, '123456');
        if (staff) {
          const userData: AdminUserData = {
            id: staff.id,
            username: staff.username,
            name: staff.name,
            role: staff.role,
            roleTitle: staff.role === 'owner' ? 'Chủ Tiệm (Toàn Quyền)' : 'Thu Ngân Ca Trực',
            shift: staff.shift,
          };
          sessionStorage.setItem('bake_sip_admin_user', JSON.stringify(userData));
          setIsLoading(false);
          onLoginSuccess(userData);
        } else {
          const fallbackData: AdminUserData = {
            id: targetUser === 'admin' ? 'staff-admin' : 'staff-thungan',
            username: targetUser,
            name: targetUser === 'admin' ? 'Nguyễn Quản Lý (Chủ Tiệm)' : 'Trần Thu Ngân',
            role: targetUser === 'admin' ? 'owner' : 'cashier',
            roleTitle: targetUser === 'admin' ? 'Chủ Tiệm (Toàn Quyền)' : 'Thu Ngân Ca Trực',
            shift: targetUser === 'admin' ? 'Toàn Thời Gian' : 'Ca Sáng (06:30 - 14:30)',
          };
          sessionStorage.setItem('bake_sip_admin_user', JSON.stringify(fallbackData));
          setIsLoading(false);
          onLoginSuccess(fallbackData);
        }
      } catch (err: unknown) {
        setIsLoading(false);
        const msg = err instanceof Error ? err.message : 'Lỗi xác thực';
        setErrorMsg(msg);
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      <div onClick={onClose} className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs transition-opacity" />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden my-6 animate-fade-in">
          {/* Top Banner */}
          <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 p-6 text-white text-center relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30 font-bold">
              <Store className="w-7 h-7" />
            </div>

            <span className="text-[10px] uppercase tracking-widest text-amber-300 font-extrabold block">
              {SHOP_CONFIG.shopName.toUpperCase()} &bull; MERCHANT PORTAL
            </span>
            <h3 className="font-serif font-black text-xl sm:text-2xl mt-1">
              Đăng Nhập Quản Trị & Thu Ngân
            </h3>
            <p className="text-xs text-stone-300 mt-1">
              Dành riêng cho nhân viên và chủ cửa hàng vận hành POS
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-stone-500" />
                <span>Tên Đăng Nhập / Mã Nhân Viên</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="VD: admin hoặc thungan..."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-stone-500" />
                <span>Mật Khẩu / Mã PIN</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-mono"
                required
              />
            </div>

            {/* Quick Login 1-Click Buttons */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                <span className="flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  Đăng nhập nhanh 1-Click (Demo):
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  className="py-1.5 px-2 bg-white hover:bg-amber-100 text-stone-800 border border-amber-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs text-center"
                >
                  👑 Quyền Admin (Chủ Tiệm)
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('thungan')}
                  className="py-1.5 px-2 bg-white hover:bg-amber-100 text-stone-800 border border-amber-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs text-center"
                >
                  🧾 Thu Ngân Ca Trực
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-stone-900/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isLoading ? 'Đang xác thực...' : 'Đăng Nhập Vào Cổng Quản Lý'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Back to Landing Link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] text-stone-500 hover:text-stone-800 font-medium transition-colors cursor-pointer"
              >
                &larr; Tôi là khách hàng, quay lại xem thực đơn
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
