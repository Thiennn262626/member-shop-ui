import { useState } from 'react';
import { CartProvider } from './context/CartContext';
import { LandingPage } from './pages/LandingPage';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { DemoBanner } from './components/common/DemoBanner';
import type { AdminUserData } from './types';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'admin'>('landing');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUserData | null>(() => {
    try {
      const saved = sessionStorage.getItem('bake_sip_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Khi bấm vào nút Quản Lý ở LandingPage
  const handleRequestAdminAccess = () => {
    if (adminUser) {
      // Đã đăng nhập trước đó trong phiên
      setCurrentView('admin');
    } else {
      // Yêu cầu xác thực đăng nhập
      setIsLoginModalOpen(true);
    }
  };

  // Đăng nhập thành công
  const handleLoginSuccess = (user: AdminUserData) => {
    setAdminUser(user);
    setIsLoginModalOpen(false);
    setCurrentView('admin');
  };

  // Đăng xuất khỏi cổng quản lý người bán
  const handleLogout = () => {
    sessionStorage.removeItem('bake_sip_admin_user');
    setAdminUser(null);
    setCurrentView('landing');
  };

  return (
    <CartProvider>
      {currentView === 'landing' ? (
        <>
          <LandingPage onOpenAdmin={handleRequestAdminAccess} />
          <AdminLoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        </>
      ) : (
        <AdminPage
          onLogout={handleLogout}
          adminUser={adminUser || undefined}
        />
      )}
      <DemoBanner />
    </CartProvider>
  );
}

export default App;
