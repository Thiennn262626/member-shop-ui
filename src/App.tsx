import { useState, useEffect, useRef } from 'react';
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

  // Dùng Ref để theo dõi màn hình hiện tại bên trong event listener
  const currentViewRef = useRef(currentView);
  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  // Lắng nghe sự kiện phiên đăng nhập hết hạn từ axios interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      setAdminUser(null);
      sessionStorage.removeItem('bake_sip_admin_user');

      // QUAN TRỌNG: CHỈ mở modal đăng nhập khi người dùng ĐANG Ở MÀN HÌNH QUẢN TRỊ ADMIN.
      // Nếu khách hàng đang xem thực đơn ở Landing Page thì tuyệt đối không làm phiền!
      if (currentViewRef.current === 'admin') {
        setCurrentView('landing');
        setLoginError('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.');
        setIsLoginModalOpen(true);
      }
    };

    window.addEventListener('shop_auth_session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('shop_auth_session_expired', handleSessionExpired);
    };
  }, []);

  // Khi người dùng chủ động bấm vào nút "Quản Lý" ở Landing Page
  const handleRequestAdminAccess = async () => {
    setLoginError(null);

    // Nếu trước đó đã có tài khoản lưu trong phiên
    if (adminUser) {
      try {
        // Kiểm tra xem phiên làm việc còn hiệu lực trên backend không
        const me = await storeService.getMe();
        if (me) {
          setAdminUser(me);
          sessionStorage.setItem('bake_sip_admin_user', JSON.stringify(me));
          setCurrentView('admin');
          return;
        }
      } catch {
        // Session đã hết hạn
      }

      // Nếu session không còn hợp lệ, xóa dữ liệu cũ và yêu cầu đăng nhập lại
      setAdminUser(null);
      sessionStorage.removeItem('bake_sip_admin_user');
    }

    // Mở modal đăng nhập sạch sẽ
    setIsLoginModalOpen(true);
  };

  // Đăng nhập thành công từ modal
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
