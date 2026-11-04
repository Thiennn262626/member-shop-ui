import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  Store,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  X,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { storeService, SHOP_CONFIG } from '../../services/storeService';
import type { AdminUserData } from '../../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AdminUserData) => void;
  initialError?: string | null;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialError = null,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialError) {
      setErrorMsg(initialError);
    }
  }, [initialError]);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mã PIN / mật khẩu.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const userData = await storeService.authenticateStaff(cleanUser, password);
      if (userData) {
        setIsLoading(false);
        setUsername('');
        setPassword('');
        onLoginSuccess(userData);
      } else {
        setIsLoading(false);
        setErrorMsg('Tên đăng nhập hoặc mã PIN không đúng. Vui lòng thử lại!');
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Lỗi xác thực hệ thống';
      setErrorMsg(msg);
    }
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
              {SHOP_CONFIG.shopName.toUpperCase()} &bull; CỔNG QUẢN TRỊ
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
                <span className="leading-tight font-medium">{errorMsg}</span>
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
                autoComplete="username"
                autoFocus
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-stone-500" />
                <span>Mật Khẩu / Mã PIN</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mã PIN hoặc mật khẩu..."
                  autoComplete="current-password"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-stone-900/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Đăng Nhập Vào Cổng Quản Lý</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
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
