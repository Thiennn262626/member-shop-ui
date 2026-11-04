import { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { LandingPage } from './pages/LandingPage';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { storeService } from './services/storeService';
import type { AdminUserData } from './types';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'admin'>('landing');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUserData | null>(() => {
    try {
      const saved = sessionStorage.getItem('bake_sip_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Lắng nghe sự kiện phiên đăng nhập hết hạn từ axios interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      setAdminUser(null);
      setCurrentView('landing');
      setLoginError('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.');
      setIsLoginModalOpen(true);
    };

    window.addEventListener('shop_auth_session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('shop_auth_session_expired', handleSessionExpired);
    };
  }, []);

  // Kiểm tra tính hợp lệ của session khi tải lại trang
  useEffect(() => {
    if (adminUser) {
      storeService.getMe().then((me) => {
        if (!me) {
          // Token không còn hợp lệ trên backend
          setAdminUser(null);
          sessionStorage.removeItem('bake_sip_admin_user');
          if (currentView === 'admin') {
            setCurrentView('landing');
            setIsLoginModalOpen(true);
          }
        } else {
          setAdminUser(me);
          sessionStorage.setItem('bake_sip_admin_user', JSON.stringify(me));
        }
      });
    }
  }, []);

  // Khi bấm vào nút Quản Lý ở LandingPage
  const handleRequestAdminAccess = () => {
    if (adminUser) {
      setCurrentView('admin');
    } else {
      setLoginError(null);
      setIsLoginModalOpen(true);
    }
  };

  // Đăng nhập thành công
  const handleLoginSuccess = (user: AdminUserData) => {
    setAdminUser(user);
    setLoginError(null);
    setIsLoginModalOpen(false);
    setCurrentView('admin');
  };

  // Đăng xuất khỏi cổng quản lý người bán
  const handleLogout = async () => {
    try {
      await storeService.logout();
    } catch (err) {
      console.warn('Lỗi mạng khi đăng xuất:', err);
    } finally {
      sessionStorage.removeItem('bake_sip_admin_user');
      setAdminUser(null);
      setCurrentView('landing');
    }
  };

  return (
    <CartProvider>
      {currentView === 'landing' ? (
        <>
          <LandingPage onOpenAdmin={handleRequestAdminAccess} />
          <AdminLoginModal
            isOpen={isLoginModalOpen}
            onClose={() => {
              setIsLoginModalOpen(false);
              setLoginError(null);
            }}
            onLoginSuccess={handleLoginSuccess}
            initialError={loginError}
          />
        </>
      ) : (
        <AdminPage
          onLogout={handleLogout}
          adminUser={adminUser || undefined}
        />
      )}
    </CartProvider>
  );
}

export default App;
