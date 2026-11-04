import React, { useState, useEffect } from 'react';
import { Header } from '../components/landing/Header';
import { Hero } from '../components/landing/Hero';
import { ProductCatalog } from '../components/landing/ProductCatalog';
import { CartDrawer } from '../components/landing/CartDrawer';
import { MemberLookupModal } from '../components/landing/MemberLookupModal';
import { OrderSuccessModal } from '../components/landing/OrderSuccessModal';
import { LuckyWheelModal } from '../components/landing/LuckyWheelModal';
import { LoyaltyPolicyModal } from '../components/landing/LoyaltyPolicyModal';
import { LiveActivityToast } from '../components/landing/LiveActivityToast';
import { MobileBottomBar } from '../components/landing/MobileBottomBar';
import { Footer } from '../components/landing/Footer';
import { useShopStore } from '../stores/useShopStore';
import type { Order } from '../types';

interface LandingPageProps {
  onOpenAdmin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAdmin }) => {
  const products = useShopStore((state) => state.products);
  const fetchProducts = useShopStore((state) => state.fetchProducts);
  const fetchShopConfig = useShopStore((state) => state.fetchShopConfig);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [lookupPhone, setLookupPhone] = useState('');
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Tải cấu hình tiệm & danh sách món qua Zustand store (chỉ nạp 1 lần duy nhất khi load trang)
  useEffect(() => {
    fetchShopConfig();
    fetchProducts();

    const handleProductChange = () => {
      fetchProducts(true);
    };
    const handleConfigChange = () => {
      fetchShopConfig(true);
    };
    window.addEventListener('bake_sip_product_updated', handleProductChange);
    window.addEventListener('bake_sip_config_updated', handleConfigChange);
    return () => {
      window.removeEventListener('bake_sip_product_updated', handleProductChange);
      window.removeEventListener('bake_sip_config_updated', handleConfigChange);
    };
  }, [fetchShopConfig, fetchProducts]);

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOrderCreated = (order: Order) => {
    setCreatedOrder(order);
  };

  const handleTrackOrder = (phone: string) => {
    setLookupPhone(phone);
    setIsLookupOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7] text-stone-900 selection:bg-amber-100 selection:text-amber-900">
      {/* Top Header */}
      <Header
        onOpenMemberLookup={() => {
          setLookupPhone('');
          setIsLookupOpen(true);
        }}
        onOpenWheel={() => setIsWheelOpen(true)}
        onOpenAdmin={onOpenAdmin}
        onOpenPolicy={() => setIsPolicyOpen(true)}
      />

      {/* Hero Section */}
      <Hero
        onOpenLookup={() => {
          setLookupPhone('');
          setIsLookupOpen(true);
        }}
        onOpenWheel={() => setIsWheelOpen(true)}
        onScrollToCatalog={scrollToCatalog}
      />

      {/* Product Catalog */}
      <main className="flex-1">
        <ProductCatalog products={products} />
      </main>

      {/* Footer */}
      <Footer onOpenPolicy={() => setIsPolicyOpen(true)} />

      {/* Interactive Cart Drawer */}
      <CartDrawer onOrderCreated={handleOrderCreated} />

      {/* Order Creation Success Modal (Hiển thị mã đơn #CH-XXXX) */}
      <OrderSuccessModal
        order={createdOrder}
        isOpen={createdOrder !== null}
        onClose={() => setCreatedOrder(null)}
        onTrackOrder={handleTrackOrder}
      />

      {/* Membership & Order Status Lookup Modal (Tra cứu theo SĐT) */}
      <MemberLookupModal
        isOpen={isLookupOpen}
        initialPhone={lookupPhone}
        onClose={() => setIsLookupOpen(false)}
        onStartOrder={scrollToCatalog}
      />

      {/* Membership Policy & Tiers Modal */}
      <LoyaltyPolicyModal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
        onOpenLookup={() => {
          setIsPolicyOpen(false);
          setLookupPhone('');
          setIsLookupOpen(true);
        }}
      />

      {/* Interactive Lucky Wheel Modal */}
      <LuckyWheelModal
        isOpen={isWheelOpen}
        onClose={() => setIsWheelOpen(false)}
      />

      {/* Live Social Proof Activity Toast */}
      <LiveActivityToast />

      {/* Mobile Sticky Bottom Bar */}
      <MobileBottomBar
        onOpenLookup={() => {
          setLookupPhone('');
          setIsLookupOpen(true);
        }}
        onOpenWheel={() => setIsWheelOpen(true)}
        onScrollToMenu={scrollToCatalog}
      />
    </div>
  );
};
