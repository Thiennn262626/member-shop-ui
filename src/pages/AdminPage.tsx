import React, { useState, useEffect, useCallback } from 'react';
import {
  Store,
  Search,
  CheckCircle2,
  MessageCircle,
  ShoppingBag,
  User,
  Check,
  AlertCircle,
  Truck,
  CreditCard,
  QrCode,
  Sparkles,
  ChefHat,
  XCircle,
  PlusCircle,
  ListOrdered,
  UtensilsCrossed,
  BarChart3,
  Users,
  UserCheck,
  PackageX,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  Printer,
  Ticket,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { storeService, ORDER_STATUS_MAP, SHOP_CONFIG, TIER_CONFIG } from '../services/storeService';
import type { AdminUserData, Customer, Order, OrderStatus } from '../types';
import { formatCurrency, formatDate, formatDateTime, formatPhone } from '../utils/format';
import { PosOrderCreator } from '../components/admin/PosOrderCreator';
import { ProductManager } from '../components/admin/ProductManager';
import { StockToggleManager } from '../components/admin/StockToggleManager';
import { AdminAnalytics } from '../components/admin/AdminAnalytics';
import { CustomerManager } from '../components/admin/CustomerManager';
import { StaffManager } from '../components/admin/StaffManager';
import { ShopSettings } from '../components/admin/ShopSettings';
import { ShiftManager } from '../components/admin/ShiftManager';
import { VoucherManager } from '../components/admin/VoucherManager';
import { PrintBillModal } from '../components/admin/PrintBillModal';
import { Pagination } from '../components/common/Pagination';
import { isVersionMismatchError } from '../utils/diff';

interface AdminPageProps {
  onLogout: () => void;
  adminUser?: AdminUserData;
}

type AdminViewType =
  | 'analytics'
  | 'pos'
  | 'orders'
  | 'shift'
  | 'stock'
  | 'vouchers'
  | 'products'
  | 'customers'
  | 'staff'
  | 'settings';

export const AdminPage: React.FC<AdminPageProps> = ({
  onLogout,
  adminUser = {
    id: 'staff-admin',
    username: 'admin',
    name: 'Nguyễn Quản Lý',
    role: 'owner',
    roleTitle: 'Chủ Cửa Hàng (Admin)',
  },
}) => {
  const isCashier = adminUser.role === 'cashier';
  const [adminView, setAdminView] = useState<AdminViewType>(() => (isCashier ? 'pos' : 'analytics'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Bảo vệ route/tab: nếu thu ngân cố tình truy cập tab của chủ tiệm thì redirect về POS
  useEffect(() => {
    if (isCashier && ['analytics', 'settings', 'vouchers'].includes(adminView)) {
      setAdminView('pos');
    }
  }, [isCashier, adminView]);

  // In hóa đơn & tem dán state
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

  // Quản lý đơn hàng state
  const [orderSearchCode, setOrderSearchCode] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [discountPointsInput, setDiscountPointsInput] = useState<number>(0);
  const [shipperNoteInput, setShipperNoteInput] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [orderPage, setOrderPage] = useState<number>(1);
  const [orderPageSize, setOrderPageSize] = useState<number>(8);

  // Cập nhật đồng hồ thời gian thực mỗi giây
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Khởi tạo danh sách đơn hàng ban đầu
  useEffect(() => {
    let isMounted = true;
    storeService.getOrders().then((initialOrders) => {
      if (isMounted) setOrders(initialOrders);
    }).catch(console.error);
    return () => {
      isMounted = false;
    };
  }, []);

  // Hàm load lại dữ liệu đơn và cập nhật selectedOrder
  const refreshData = useCallback(async () => {
    try {
      const updatedOrders = await storeService.getOrders();
      setOrders(updatedOrders);

      if (selectedOrder) {
        const refreshedSelected = updatedOrders.find((o) => o.id === selectedOrder.id || o.orderCode === selectedOrder.orderCode);
        if (refreshedSelected) {
          setSelectedOrder(refreshedSelected);
          const cust = await storeService.findCustomerByPhone(refreshedSelected.customerPhone);
          setActiveCustomer(cust || null);
        }
      }
    } catch (err) {
      console.error('Failed to refresh orders:', err);
    }
  }, [selectedOrder]);

  // Lắng nghe Realtime Event
  useEffect(() => {
    const handleOrderUpdate = async (e: Event) => {
      const customEvent = e as CustomEvent<Order>;
      const updatedOrder = customEvent.detail;
      const latestOrders = await storeService.getOrders();
      setOrders(latestOrders);

      if (selectedOrder && (selectedOrder.id === updatedOrder?.id || selectedOrder.orderCode === updatedOrder?.orderCode)) {
        const found = latestOrders.find((o) => o.id === selectedOrder.id || o.orderCode === selectedOrder.orderCode);
        if (found) {
          setSelectedOrder(found);
          const cust = await storeService.findCustomerByPhone(found.customerPhone);
          setActiveCustomer(cust || null);
        }
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bake_sip_realtime_ping_v5') {
        refreshData();
      }
    };

    window.addEventListener('bake_sip_order_updated', handleOrderUpdate);
    window.addEventListener('bake_sip_order_created', handleOrderUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('bake_sip_order_updated', handleOrderUpdate);
      window.removeEventListener('bake_sip_order_created', handleOrderUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [selectedOrder, refreshData]);

  // Tra cứu mã đơn hoặc SĐT
  const handleLookupOrder = async (codeOrPhoneToSearch?: string) => {
    setSearchError(null);
    setActionSuccess(null);
    const query = (codeOrPhoneToSearch ?? orderSearchCode).trim();
    if (!query) return;

    try {
      let found = await storeService.getOrderByCode(query);
      if (!found) {
        const cleanPhone = query.replace(/\D/g, '');
        if (cleanPhone) {
          const phoneOrders = await storeService.getOrdersByPhone(cleanPhone);
          if (phoneOrders.length > 0) {
            found = phoneOrders[0];
          }
        }
      }

      if (found) {
        setSelectedOrder(found);
        const cust = await storeService.findCustomerByPhone(found.customerPhone);
        setActiveCustomer(cust || null);
        setDiscountPointsInput(found.discountPointsUsed || 0);
        setShipperNoteInput(found.shipperInfo || '');
      } else {
        setSelectedOrder(null);
        setActiveCustomer(null);
        setSearchError(`Không tìm thấy đơn hàng nào có mã hoặc SĐT "${query}".`);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Lỗi tra cứu đơn hàng');
    }
  };

  const handleSelectOrderFromList = async (order: Order) => {
    setOrderSearchCode(order.orderCode);
    setSelectedOrder(order);
    try {
      const cust = await storeService.findCustomerByPhone(order.customerPhone);
      setActiveCustomer(cust || null);
    } catch {
      setActiveCustomer(null);
    }
    setDiscountPointsInput(order.discountPointsUsed || 0);
    setShipperNoteInput(order.shipperInfo || '');
    setSearchError(null);
    setActionSuccess(null);
  };

  const refreshSelectedOrder = async (orderCode: string) => {
    try {
      const latestOrders = await storeService.getOrders();
      setOrders(latestOrders);
      const fresh = latestOrders.find((o) => o.orderCode === orderCode || o.id === orderCode);
      if (fresh) setSelectedOrder(fresh);
    } catch (err) {
      console.error('Failed to refresh order:', err);
    }
  };

  const handleConfirmAndPrepare = async () => {
    if (!selectedOrder) return;
    try {
      const { order: updated, customer } = await storeService.updateOrderStatus(selectedOrder.orderCode, {
        status: 'confirmed',
        discountPointsUsed: discountPointsInput,
        version: selectedOrder.version,
      });

      setSelectedOrder(updated);
      setActiveCustomer(customer);
      const latestOrders = await storeService.getOrders();
      setOrders(latestOrders);
      setActionSuccess(`Đã xác nhận đơn ${updated.orderCode} & Bắt đầu làm bánh.`);
    } catch (e: unknown) {
      if (isVersionMismatchError(e)) {
        setSearchError('⚠️ Đơn hàng đã được cập nhật từ thiết bị khác! Hệ thống đang tải lại dữ liệu mới nhất...');
        await refreshSelectedOrder(selectedOrder.orderCode);
      } else {
        const message = e instanceof Error ? e.message : 'Lỗi cập nhật đơn';
        setSearchError(message);
      }
    }
  };

  const handleTogglePayment = async (paymentStatus: 'paid' | 'unpaid') => {
    if (!selectedOrder) return;
    try {
      const { order: updated, customer } = await storeService.updateOrderStatus(selectedOrder.orderCode, {
        paymentStatus,
        version: selectedOrder.version,
      });

      setSelectedOrder(updated);
      setActiveCustomer(customer);
      const latestOrders = await storeService.getOrders();
      setOrders(latestOrders);

      if (paymentStatus === 'paid') {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
        setActionSuccess(`✓ Đã xác nhận khách thanh toán ${formatCurrency(updated.orderTotal)} thành công!`);
      } else {
        setActionSuccess(`Đã chuyển trạng thái về "Chưa thanh toán".`);
      }
    } catch (e: unknown) {
      if (isVersionMismatchError(e)) {
        setSearchError('⚠️ Trạng thái thanh toán đã được cập nhật từ thiết bị khác! Đang tải lại dữ liệu mới nhất...');
        await refreshSelectedOrder(selectedOrder.orderCode);
      } else {
        const message = e instanceof Error ? e.message : 'Lỗi cập nhật thanh toán';
        setSearchError(message);
      }
    }
  };

  const handleStartShipping = async () => {
    if (!selectedOrder) return;
    try {
      const { order: updated, customer } = await storeService.updateOrderStatus(selectedOrder.orderCode, {
        status: 'shipping',
        shipperInfo: shipperNoteInput.trim() || 'Shipper tiệm đang giao',
        version: selectedOrder.version,
      });

      setSelectedOrder(updated);
      setActiveCustomer(customer);
      const latestOrders = await storeService.getOrders();
      setOrders(latestOrders);
      setActionSuccess(`Đã chuyển đơn ${updated.orderCode} sang trạng thái "Đang giao hàng".`);
    } catch (e: unknown) {
      if (isVersionMismatchError(e)) {
        setSearchError('⚠️ Trạng thái giao hàng đã được cập nhật từ thiết bị khác! Đang tải lại dữ liệu mới nhất...');
        await refreshSelectedOrder(selectedOrder.orderCode);
      } else {
        const message = e instanceof Error ? e.message : 'Lỗi cập nhật giao hàng';
        setSearchError(message);
      }
    }
  };

  const handleCompleteOrder = async () => {
    if (!selectedOrder) return;
    try {
      const { order: updated, customer } = await storeService.updateOrderStatus(selectedOrder.orderCode, {
        status: 'completed',
        paymentStatus: 'paid',
        version: selectedOrder.version,
      });

      setSelectedOrder(updated);
      setActiveCustomer(customer);
      const latestOrders = await storeService.getOrders();
      setOrders(latestOrders);

      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      setActionSuccess(
        `🎉 Đơn hàng ${updated.orderCode} đã HOÀN TẤT thành công! Đã tích +${updated.earnedPoints} điểm cho ${customer.name}.`
      );
    } catch (e: unknown) {
      if (isVersionMismatchError(e)) {
        setSearchError('⚠️ Đơn hàng đã được hoàn tất bởi thiết bị khác! Đang tải lại dữ liệu mới nhất...');
        await refreshSelectedOrder(selectedOrder.orderCode);
      } else {
        const message = e instanceof Error ? e.message : 'Lỗi khi hoàn tất đơn';
        setSearchError(message);
      }
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${selectedOrder.orderCode} không?`)) return;

    try {
      const { order: updated, customer } = await storeService.updateOrderStatus(selectedOrder.orderCode, {
        status: 'cancelled',
        version: selectedOrder.version,
      });

      setSelectedOrder(updated);
      setActiveCustomer(customer);
      const latestOrders = await storeService.getOrders();
      setOrders(latestOrders);
      setActionSuccess(`Đã hủy đơn hàng ${updated.orderCode}.`);
    } catch (e: unknown) {
      if (isVersionMismatchError(e)) {
        setSearchError('⚠️ Đơn hàng đã được thay đổi từ thiết bị khác! Đang tải lại dữ liệu mới nhất...');
        await refreshSelectedOrder(selectedOrder.orderCode);
      } else {
        const message = e instanceof Error ? e.message : 'Lỗi khi hủy đơn';
        setSearchError(message);
      }
    }
  };

  const handlePosOrderCreated = async (orderId: string) => {
    const updated = await storeService.getOrders();
    setOrders(updated);
    const created = updated.find((o) => o.id === orderId || o.orderCode === orderId);
    if (created) setSelectedOrder(created);
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ALL') return true;
    return o.status === statusFilter;
  });

  const paginatedOrders = filteredOrders.slice(
    (orderPage - 1) * orderPageSize,
    orderPage * orderPageSize
  );

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const confirmedCount = orders.filter((o) => o.status === 'confirmed').length;
  const shippingCount = orders.filter((o) => o.status === 'shipping').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;

  // Sidebar Menu Items theo phân quyền (Chủ tiệm vs Thu ngân)
  const allMenuItems = [
    {
      id: 'analytics' as AdminViewType,
      label: 'Báo Cáo & Doanh Thu',
      icon: BarChart3,
      badge: null,
      badgeColor: undefined,
      ownerOnly: true,
    },
    {
      id: 'pos' as AdminViewType,
      label: 'Quầy Thu Ngân (POS)',
      icon: PlusCircle,
      badge: 'Hot',
      badgeColor: 'bg-amber-400 text-stone-950 font-black',
      ownerOnly: false,
    },
    {
      id: 'orders' as AdminViewType,
      label: 'Quản Lý Đơn Hàng',
      icon: ListOrdered,
      badge: pendingCount > 0 ? `${pendingCount} mới` : null,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
      ownerOnly: false,
    },
    {
      id: 'shift' as AdminViewType,
      label: 'Giao Ca & Chốt Két',
      icon: Clock,
      badge: 'Két Tiền',
      badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
      ownerOnly: false,
    },
    {
      id: 'stock' as AdminViewType,
      label: 'Báo Hết Món & Topping',
      icon: PackageX,
      badge: 'Bật/Tắt',
      badgeColor: 'bg-rose-100 text-rose-900 border border-rose-200',
      ownerOnly: false,
    },
    {
      id: 'vouchers' as AdminViewType,
      label: 'Mã Giảm Giá (Voucher)',
      icon: Ticket,
      badge: 'Chủ Tiệm',
      badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300',
      ownerOnly: true,
    },
    {
      id: 'products' as AdminViewType,
      label: isCashier ? 'Xem Thực Đơn (Bật/Tắt)' : 'Thực Đơn Sản Phẩm',
      icon: UtensilsCrossed,
      badge: null,
      badgeColor: undefined,
      ownerOnly: false,
    },
    {
      id: 'customers' as AdminViewType,
      label: isCashier ? 'Tra Cứu Khách Hàng' : 'Quản Lý Hội Viên CRM',
      icon: Users,
      badge: null,
      badgeColor: undefined,
      ownerOnly: false,
    },
    {
      id: 'staff' as AdminViewType,
      label: isCashier ? 'Lịch Làm Việc Của Tôi' : 'Phân Ca & Chấm Công Nhân Sự',
      icon: UserCheck,
      badge: isCashier ? 'Điểm Danh' : 'Bảng Lương',
      badgeColor: isCashier
        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
        : 'bg-amber-100 text-amber-900 border border-amber-300',
      ownerOnly: false,
    },
    {
      id: 'settings' as AdminViewType,
      label: 'Cài Đặt Cửa Hàng',
      icon: Settings,
      badge: null,
      badgeColor: undefined,
      ownerOnly: true,
    },
  ];

  const menuItems = allMenuItems.filter((item) => !isCashier || !item.ownerOnly);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row text-stone-900 font-sans">
      {/* SIDEBAR DÀNH CHO NGƯỜI BÁN */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-stone-900 text-white flex flex-col justify-between border-r border-stone-800 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top Brand Logo & Navigation */}
        <div className="overflow-y-auto flex-1 flex flex-col">
          <div className="p-5 border-b border-stone-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-serif font-black text-white text-base tracking-tight leading-tight">
                  {SHOP_CONFIG.shopName}
                </h1>
                <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest block">
                  Merchant Portal
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="p-4 mx-3 my-3 bg-stone-800/80 rounded-2xl border border-stone-700/60 flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                isCashier ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-white truncate">{adminUser.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                    isCashier
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}
                >
                  {isCashier ? 'Thu Ngân' : 'Chủ Tiệm'}
                </span>
                {adminUser.shift && (
                  <span className="text-[10px] text-stone-400 truncate">
                    &bull; {adminUser.shift.split('(')[0].trim()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Menu Links */}
          <nav className="px-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = adminView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setAdminView(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 font-black'
                      : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-stone-950' : 'text-stone-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.badgeColor || 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar: Logout Action */}
        <div className="p-3 border-t border-stone-800 space-y-2 shrink-0">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-stone-800/80 hover:bg-rose-950/50 text-stone-300 hover:text-rose-300 border border-stone-700/60 hover:border-rose-800/50 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất Khỏi Cổng Quản Lý</span>
          </button>

          <div className="text-center text-[10px] text-stone-500">
            Hệ thống Bake & Sip POS v2.5
          </div>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar */}
        <header className="bg-white border-b border-stone-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif font-extrabold text-stone-900 text-base sm:text-lg flex items-center gap-2">
                <span>
                  {menuItems.find((m) => m.id === adminView)?.label || 'Cổng Quản Trị'}
                </span>
              </h2>
            </div>
          </div>

          {/* Realtime Clock & Live Badge */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Clock */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-600 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl font-mono">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>
                {currentTime.toLocaleTimeString('vi-VN')} &bull;{' '}
                {new Intl.DateTimeFormat('vi-VN', {
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit',
                }).format(currentTime)}
              </span>
            </div>

            {/* Live Badge */}
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold text-emerald-800 font-mono">POS Online</span>
            </div>
          </div>
        </header>

        {/* BODY VIEWS THEO TỪNG TAB */}
        <div className="flex-1 flex flex-col">
          {/* TAB 1: BÁO CÁO & DOANH THU */}
          {adminView === 'analytics' && !isCashier && <AdminAnalytics />}

          {/* TAB 2: QUẦY THU NGÂN POS */}
          {adminView === 'pos' && (
            <PosOrderCreator
              onOrderCreated={handlePosOrderCreated}
              onSwitchToOrdersList={() => setAdminView('orders')}
              onSwitchToStockManager={() => setAdminView('stock')}
            />
          )}

          {/* TAB 3: QUẢN LÝ ĐƠN HÀNG */}
          {adminView === 'orders' && (
            <main className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* CỘT TRÁI: TRA CỨU & XỬ LÝ QUY TRÌNH ĐƠN HÀNG */}
              <div className="lg:col-span-7 space-y-5">
                {/* Quick Lookup Card */}
                <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-serif font-extrabold text-stone-900 text-lg">
                        Tra Cứu & Xác Nhận Đơn Hàng
                      </h2>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Nhập mã đơn (VD: #BS-8924) hoặc Số Điện Thoại để xem chi tiết
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAdminView('pos')}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Lên Đơn POS</span>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Nhập mã đơn (VD: #BS-8924) hoặc SĐT khách..."
                        value={orderSearchCode}
                        onChange={(e) => setOrderSearchCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLookupOrder()}
                        className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl text-xs sm:text-sm font-mono font-bold text-stone-900 uppercase placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:bg-white"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLookupOrder()}
                      className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      Tra Cứu
                    </button>
                  </div>

                  {/* Error Message */}
                  {searchError && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{searchError}</span>
                    </div>
                  )}

                  {/* Success Message */}
                  {actionSuccess && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                      <span>{actionSuccess}</span>
                    </div>
                  )}
                </div>

                {/* Chi tiết đơn hàng đang chọn */}
                {selectedOrder ? (
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-5 animate-fade-in">
                    {/* Header đơn */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xl sm:text-2xl font-black text-stone-900 tracking-wider">
                            {selectedOrder.orderCode}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              ORDER_STATUS_MAP[selectedOrder.status].badgeClass
                            }`}
                          >
                            {ORDER_STATUS_MAP[selectedOrder.status].label}
                          </span>

                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
                              selectedOrder.paymentStatus === 'paid'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-900 border-amber-300'
                            }`}
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{selectedOrder.paymentStatus === 'paid' ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}</span>
                          </span>

                          {selectedOrder.createdSource === 'pos' && (
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-bold border border-stone-200">
                              Tạo tại POS
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-stone-400 mt-1 block">
                          Khởi tạo lúc: {formatDate(selectedOrder.createdAt)}
                          {selectedOrder.paidAt && ` &bull; Đã TT: ${formatDate(selectedOrder.paidAt)}`}
                        </span>
                      </div>

                      {/* Action Buttons: In Hóa Đơn & Zalo */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setOrderToPrint(selectedOrder)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          <span>In Hóa Đơn & Tem</span>
                        </button>

                        <a
                          href={`https://zalo.me/${selectedOrder.customerPhone}?text=${encodeURIComponent(
                            `Chào ${selectedOrder.customerName}, tiệm bánh Bake & Sip phản hồi về đơn hàng ${selectedOrder.orderCode} của bạn:`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Chat Zalo Khách</span>
                        </a>
                      </div>
                    </div>

                    {/* Thông tin khách hàng */}
                    <div className="bg-stone-50 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 border border-stone-200/80">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-900 text-sm">
                            {selectedOrder.customerName}
                          </h4>
                          <span className="text-xs text-stone-500 font-mono">
                            {formatPhone(selectedOrder.customerPhone)}
                          </span>
                        </div>
                      </div>

                      {activeCustomer && (
                        <div className="text-right text-xs">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px] uppercase">
                            {TIER_CONFIG[activeCustomer.tier].label}
                          </span>
                          <div className="text-stone-600 mt-0.5">
                            Điểm khả dụng: <strong className="text-amber-800 font-mono">{activeCustomer.availablePoints} điểm</strong>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Danh sách món chi tiết */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                        Danh Sách Món Khách Đặt ({selectedOrder.items.length} món)
                      </h4>

                      <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                        {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="p-3.5 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-bold text-stone-900 text-xs sm:text-sm">
                                {item.quantity}x {item.productName}
                              </div>

                              {item.optionsSummary && (
                                <div className="text-xs text-amber-800 font-medium mt-0.5">
                                  {item.optionsSummary}
                                </div>
                              )}

                              {item.itemNote && (
                                <div className="text-xs text-stone-600 italic bg-amber-50/70 p-1.5 rounded-lg mt-1 border border-amber-200/80">
                                  📝 <strong>Ghi chú:</strong> {item.itemNote}
                                </div>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <div className="font-mono font-bold text-xs sm:text-sm text-stone-900">
                                {formatCurrency(item.totalPrice)}
                              </div>
                              <div className="text-[10px] text-stone-400">
                                {formatCurrency(item.unitPrice)} / phần
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Thông tin giao hàng & hình thức nhận */}
                      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-stone-700">Hình thức giao nhận:</span>
                          <span className="text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-lg">
                            {selectedOrder.fulfillmentType === 'delivery' ? '🚚 Giao hàng tận nơi' : '🏪 Nhận tại quán'}
                          </span>
                        </div>
                        {selectedOrder.fulfillmentType === 'delivery' && (
                          <div className="space-y-1 pt-1 border-t border-stone-200/60">
                            <div>
                              <span className="text-stone-500">Địa chỉ giao:</span>{' '}
                              <strong className="text-stone-900">{selectedOrder.deliveryAddress || 'Chưa cung cấp'}</strong>
                            </div>
                            {selectedOrder.deliveryScheduledTime && (
                              <div className="text-amber-700 font-semibold">
                                📅 Thời gian hẹn giao: {formatDateTime(selectedOrder.deliveryScheduledTime)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {selectedOrder.note && (
                        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
                          <strong>Ghi chú đơn:</strong> {selectedOrder.note}
                        </div>
                      )}

                      {selectedOrder.shipperInfo && (
                        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2">
                          <Truck className="w-4 h-4 shrink-0 text-indigo-600" />
                          <span><strong>Giao hàng:</strong> {selectedOrder.shipperInfo}</span>
                        </div>
                      )}
                    </div>

                    {/* Giảm giá điểm */}
                    {selectedOrder.status === 'pending' && activeCustomer && activeCustomer.availablePoints > 0 && (
                      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-900">Khách muốn đổi điểm giảm tiền?</span>
                          <span className="text-stone-600">Có sẵn: <strong>{activeCustomer.availablePoints} điểm</strong></span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={activeCustomer.availablePoints}
                            step={5}
                            value={discountPointsInput}
                            onChange={(e) => setDiscountPointsInput(Math.min(activeCustomer.availablePoints, Math.max(0, Number(e.target.value))))}
                            className="w-24 px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900"
                          />
                          <span className="text-xs text-stone-600">
                            điểm (= giảm {formatCurrency(discountPointsInput * SHOP_CONFIG.pointToVndRatio)})
                          </span>
                          <button
                            type="button"
                            onClick={() => setDiscountPointsInput(activeCustomer.availablePoints)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 text-[11px] font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                          >
                            Dùng hết
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tạm tính & Thực thu */}
                    <div className="border-t border-stone-200 pt-3 space-y-1.5 text-xs text-stone-600">
                      <div className="flex items-center justify-between">
                        <span>Tạm tính tiền món:</span>
                        <span className="font-bold text-stone-900">{formatCurrency(selectedOrder.subTotal)}</span>
                      </div>

                      {selectedOrder.voucherDiscount ? (
                        <div className="flex items-center justify-between text-emerald-600 font-medium">
                          <span>Giảm giá Voucher ({selectedOrder.voucherCode}):</span>
                          <span>-{formatCurrency(selectedOrder.voucherDiscount)}</span>
                        </div>
                      ) : null}

                      {selectedOrder.discountAmount > 0 && (
                        <div className="flex items-center justify-between text-rose-600 font-medium">
                          <span>Đã trừ điểm tích lũy ({selectedOrder.discountPointsUsed} điểm):</span>
                          <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                        </div>
                      )}

                      {selectedOrder.fulfillmentType === 'delivery' && (
                        <div className="flex items-center justify-between text-stone-700">
                          <span>Phí giao hàng:</span>
                          <span>{selectedOrder.shippingFee ? formatCurrency(selectedOrder.shippingFee) : '0đ (Freeship)'}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-base font-extrabold text-stone-900 pt-1 border-t border-stone-100">
                        <span>Thực thu đơn hàng:</span>
                        <span className="text-xl text-amber-800 font-mono font-black">
                          {formatCurrency(selectedOrder.orderTotal)}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium">
                        {selectedOrder.status === 'completed'
                          ? `✓ Đã tích lũy +${selectedOrder.earnedPoints} điểm cho khách hàng`
                          : `Dự kiến tích +${selectedOrder.earnedPoints} điểm sau khi hoàn tất đơn`}
                      </div>
                    </div>

                    {/* BỘ ĐIỀU KHIỂN QUY TRÌNH XỬ LÝ ĐƠN HÀNG */}
                    <div className="border-t border-stone-200 pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                          Quy Trình & Thao Tác Đơn Hàng
                        </span>
                        <span className="text-xs text-stone-400">
                          Bước {ORDER_STATUS_MAP[selectedOrder.status].step}/4
                        </span>
                      </div>

                      {/* PENDING -> TIẾP NHẬN */}
                      {selectedOrder.status === 'pending' && (
                        <div className="space-y-2.5 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
                          <p className="text-xs text-amber-900">
                            Khách vừa gửi mã đơn tạm qua Zalo. Hãy kiểm tra nguyên liệu và bấm tiếp nhận để bắt đầu làm bánh!
                          </p>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              onClick={handleConfirmAndPrepare}
                              className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 active:scale-95 transition-all cursor-pointer"
                            >
                              <ChefHat className="w-5 h-5" />
                              <span>1. Xác Nhận Tiếp Nhận Đơn (Bắt Đầu Làm Món)</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleCancelOrder}
                              className="px-4 py-3 bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 border border-stone-200 hover:border-rose-200 rounded-2xl text-xs font-semibold transition-all cursor-pointer"
                            >
                              Hủy đơn
                            </button>
                          </div>
                        </div>
                      )}

                      {/* CONFIRMED */}
                      {selectedOrder.status === 'confirmed' && (
                        <div className="space-y-4 bg-sky-50/60 p-4 rounded-2xl border border-sky-200">
                          <div className="p-3 bg-white rounded-xl border border-sky-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4 text-sky-600" />
                                Trạng Thái Thanh Toán:
                              </span>
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  selectedOrder.paymentStatus === 'paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {selectedOrder.paymentStatus === 'paid' ? 'Đã Nhận Tiền' : 'Chưa Nhận Tiền'}
                              </span>
                            </div>

                            {selectedOrder.paymentStatus === 'unpaid' ? (
                              <div className="flex items-center justify-between gap-2 pt-1">
                                <span className="text-[11px] text-stone-500">
                                  Khách có thể đang quét mã VietQR trên trang tra cứu.
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePayment('paid')}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                                >
                                  💰 Xác Nhận Đã Nhận Tiền
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-2 pt-1 text-xs text-emerald-800 font-medium">
                                <span>✓ Đã nhận đủ {formatCurrency(selectedOrder.orderTotal)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePayment('unpaid')}
                                  className="text-[11px] text-stone-400 hover:text-stone-700 underline cursor-pointer"
                                >
                                  Đổi lại thành chưa thanh toán
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-stone-700">
                              Bánh đã làm xong? Chọn bước tiếp theo:
                            </div>

                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Ghi chú Shipper (VD: GrabBike Nguyễn Văn A)..."
                                  value={shipperNoteInput}
                                  onChange={(e) => setShipperNoteInput(e.target.value)}
                                  className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={handleStartShipping}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 shadow-xs"
                                >
                                  <Truck className="w-4 h-4" />
                                  <span>2. Bắt Đầu Giao Hàng</span>
                                </button>
                              </div>

                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={handleCompleteOrder}
                                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>Hoàn Tất Ngay & Tích Điểm (Khách Lấy Tại Quầy / Giao Trực Tiếp)</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SHIPPING */}
                      {selectedOrder.status === 'shipping' && (
                        <div className="space-y-3 bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200">
                          <div className="flex items-center gap-2 text-xs text-indigo-900">
                            <Truck className="w-5 h-5 text-indigo-600 shrink-0" />
                            <span>Đơn hàng đang trên đường giao đến khách hàng.</span>
                          </div>

                          {selectedOrder.paymentStatus === 'unpaid' && (
                            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                              <span className="text-amber-900 font-medium">Khách chưa thanh toán:</span>
                              <button
                                type="button"
                                onClick={() => handleTogglePayment('paid')}
                                className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs cursor-pointer"
                              >
                                Xác nhận đã nhận tiền
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={handleCompleteOrder}
                            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                          >
                            <Sparkles className="w-5 h-5 text-amber-300" />
                            <span>Xác Nhận Đã Giao Thành Công & Hoàn Tất Tích Điểm (+{selectedOrder.earnedPoints} điểm)</span>
                          </button>
                        </div>
                      )}

                      {/* COMPLETED */}
                      {selectedOrder.status === 'completed' && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-emerald-900 text-xs">
                          <div className="flex items-center gap-2 font-bold text-sm">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span>Đơn hàng đã hoàn tất thành công!</span>
                          </div>
                          <p className="text-emerald-800">
                            Điểm thưởng (+{selectedOrder.earnedPoints} điểm) đã được cộng chính thức vào thẻ thành viên của khách.
                          </p>
                        </div>
                      )}

                      {/* CANCELLED */}
                      {selectedOrder.status === 'cancelled' && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                          <span>Đơn hàng này đã bị hủy. Không phát sinh tích điểm.</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-2">
                    <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
                    <h3 className="font-serif font-bold text-stone-800 text-base">Chưa chọn đơn hàng nào</h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      Nhập mã đơn từ Zalo hoặc chọn một đơn trong danh sách bên phải để xử lý.
                    </p>
                  </div>
                )}
              </div>

              {/* CỘT PHẢI: DANH SÁCH ĐƠN HÀNG VỚI BỘ LỌC ĐA TRẠNG THÁI */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-stone-900 text-base">
                        Danh Sách Đơn Hàng ({filteredOrders.length})
                      </h3>
                      <span className="text-[11px] text-stone-500">
                        Cập nhật thời gian thực khi khách đặt từ website
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">Live</span>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => { setStatusFilter('ALL'); setOrderPage(1); }}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                        statusFilter === 'ALL'
                          ? 'bg-stone-900 text-amber-300'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      Tất cả ({orders.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => { setStatusFilter('pending'); setOrderPage(1); }}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        statusFilter === 'pending'
                          ? 'bg-amber-500 text-stone-950 font-bold'
                          : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      <span>Chờ duyệt</span>
                      {pendingCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-amber-900 text-amber-200 text-[10px] flex items-center justify-center font-bold">
                          {pendingCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setStatusFilter('confirmed'); setOrderPage(1); }}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        statusFilter === 'confirmed'
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-200'
                      }`}
                    >
                      <span>Đang làm ({confirmedCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setStatusFilter('shipping'); setOrderPage(1); }}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        statusFilter === 'shipping'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
                      }`}
                    >
                      <span>Đang giao ({shippingCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setStatusFilter('completed'); setOrderPage(1); }}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                        statusFilter === 'completed'
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      Đã xong ({completedCount})
                    </button>
                  </div>

                  {/* List */}
                  {filteredOrders.length === 0 ? (
                    <div className="p-6 text-center text-xs text-stone-500 bg-stone-50 rounded-2xl border border-stone-100">
                      Không có đơn hàng nào trong mục này.
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                        {paginatedOrders.map((order) => {
                          const isSelected = selectedOrder?.id === order.id;
                          const statusInfo = ORDER_STATUS_MAP[order.status];

                          return (
                            <button
                              type="button"
                              key={order.id}
                              onClick={() => handleSelectOrderFromList(order)}
                              className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-amber-600 bg-amber-50/70 shadow-xs ring-1 ring-amber-600/30'
                                  : 'border-stone-200 bg-white hover:border-amber-400'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-sm text-stone-900">
                                    {order.orderCode}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusInfo.badgeClass}`}>
                                    {statusInfo.label}
                                  </span>
                                  {order.createdSource === 'pos' && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900">
                                      POS
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-bold text-amber-800 font-mono">
                                  {formatCurrency(order.orderTotal)}
                                </span>
                              </div>

                              <div className="text-xs text-stone-600 mt-1.5 flex items-center justify-between">
                                <span>{order.customerName} ({order.customerPhone})</span>
                                <span className="text-[11px] text-stone-400">{order.items.length} món</span>
                              </div>

                              <div className="flex items-center justify-between mt-1 text-[11px]">
                                <span className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-800'}`}>
                                  {order.paymentStatus === 'paid' ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán'}
                                </span>
                                <span className="text-stone-400">{formatDate(order.createdAt)}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Phân trang danh sách đơn hàng chuẩn CEO */}
                      <Pagination
                        currentPage={orderPage}
                        totalPages={Math.ceil(filteredOrders.length / orderPageSize)}
                        totalItems={filteredOrders.length}
                        pageSize={orderPageSize}
                        onPageChange={setOrderPage}
                        onPageSizeChange={(newSize) => {
                          setOrderPageSize(newSize);
                          setOrderPage(1);
                        }}
                        pageSizeOptions={[5, 10, 20, 50]}
                        itemLabel="đơn"
                        className="rounded-2xl"
                      />
                    </>
                  )}
                </div>

                {/* Quick Bank & POS config */}
                <div className="bg-stone-900 text-white rounded-3xl p-5 space-y-3">
                  <h4 className="font-serif font-bold text-sm text-amber-300 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4" />
                    Tài Khoản Ngân Hàng Nhận Tiền
                  </h4>
                  <div className="space-y-1.5 text-xs text-stone-300">
                    <div className="flex items-center justify-between">
                      <span>Ngân hàng:</span>
                      <strong className="text-white">{SHOP_CONFIG.bank.bankName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Số tài khoản:</span>
                      <strong className="text-amber-300 font-mono font-bold">{SHOP_CONFIG.bank.accountNumber}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Chủ tài khoản:</span>
                      <strong className="text-white">{SHOP_CONFIG.bank.accountHolder}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          )}

          {/* TAB 3.2: GIAO CA & CHỐT KÉT THU NGÂN */}
          {adminView === 'shift' && (
            <div className="flex-1 p-3 sm:p-6 max-w-6xl mx-auto w-full">
              <ShiftManager
                currentStaff={{
                  id: adminUser.id,
                  name: adminUser.name,
                  username: adminUser.username,
                  pinCode: '0000',
                  role: adminUser.role,
                  shift: adminUser.shift || 'Ca Trực',
                  isActive: true,
                  createdAt: new Date().toISOString(),
                }}
              />
            </div>
          )}

          {/* TAB 3.5: QUẢN LÝ BÁO HẾT MÓN & TOPPING */}
          {adminView === 'stock' && <StockToggleManager />}

          {/* TAB 3.8: QUẢN LÝ MÃ GIẢM GIÁ (VOUCHERS) */}
          {adminView === 'vouchers' && !isCashier && (
            <div className="flex-1 p-3 sm:p-6 max-w-6xl mx-auto w-full">
              <VoucherManager />
            </div>
          )}

          {/* TAB 4: QUẢN LÝ THỰC ĐƠN & SẢN PHẨM */}
          {adminView === 'products' && <ProductManager userRole={adminUser.role} />}

          {/* TAB 5: QUẢN LÝ KHÁCH HÀNG CRM */}
          {adminView === 'customers' && <CustomerManager userRole={adminUser.role} />}

          {/* TAB 6: PHÂN CA, CHẤM CÔNG & QUẢN LÝ NHÂN SỰ */}
          {adminView === 'staff' && (
            <StaffManager
              currentStaff={{
                id: adminUser.id,
                name: adminUser.name,
                username: adminUser.username,
                pinCode: '0000',
                role: adminUser.role,
                shift: adminUser.shift || 'Ca Linh Hoạt',
                hourlyRate: adminUser.hourlyRate || (adminUser.role === 'owner' ? 50000 : 28000),
                isActive: true,
                createdAt: new Date().toISOString(),
              }}
              userRole={adminUser.role}
            />
          )}

          {/* TAB 7: CÀI ĐẶT CỬA HÀNG */}
          {adminView === 'settings' && !isCashier && <ShopSettings />}
        </div>
      </div>

      {/* MODAL IN HÓA ĐƠN & TEM DÁN */}
      {orderToPrint && (
        <PrintBillModal
          order={orderToPrint}
          onClose={() => setOrderToPrint(null)}
        />
      )}
    </div>
  );
};
