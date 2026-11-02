import { useState } from 'react';
import { CartProvider } from './context/CartContext';
import { LandingPage } from './pages/LandingPage';
import { AdminPage } from './pages/AdminPage';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'admin'>('landing');

  return (
    <CartProvider>
      {currentView === 'landing' ? (
        <LandingPage onOpenAdmin={() => setCurrentView('admin')} />
      ) : (
        <AdminPage onBackToLanding={() => setCurrentView('landing')} />
      )}
    </CartProvider>
  );
}

export default App;
