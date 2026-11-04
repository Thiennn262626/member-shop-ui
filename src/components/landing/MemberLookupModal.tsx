import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Search,
  Sparkles,
  QrCode,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  Package,
  Copy,
  Check,
  MessageSquare,
  ChefHat,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { storeService, ORDER_STATUS_MAP, SHOP_CONFIG, TIER_CONFIG } from '../../services/storeService';
import type { Customer, Order, OrderStatus, PointTransaction } from '../../types';
import { formatCurrency, formatDate, formatPhone } from '../../utils/format';

interface MemberLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOrder?: () => void;
  initialPhone?: string;
  defaultTab?: 'orders' | 'card';
}

export const MemberLookupModal: React.FC<MemberLookupModalProps> = ({
  isOpen,
  onClose,
  onStartOrder,
  initialPhone = '',
  defaultTab = 'orders',
}) => {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [activeTab, setActiveTab] = useState<'orders' | 'card'>(defaultTab);
  const [searchedCustomer, setSearchedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [filterTxType, setFilterTxType] = useState<'ALL' | 'EARN' | 'REDEEM'>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleSearch = useCallback((phoneToSearch?: string) => {
    const targetPhone = phoneToSearch ?? phoneNumber;
    const clean = targetPhone.trim().replace(/\D/g, '');
    if (!clean) return;

    storeService.getCustomerFullLookup(clean).then((res) => {
      if (res && res.customer) {
        setSearchedCustomer(res.customer);
        setCustomerOrders(res.orders || []);
        setTransactions(res.transactions || []);
        setHasSearched(true);

        if (res.customer.tier === 'DIAMOND' || res.customer.tier === 'GOLD') {
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.5 },
          });
        }
      } else {
        setSearchedCustomer(null);
        setCustomerOrders([]);
        setTransactions([]);
        setHasSearched(true);
      }
    });
  }, [phoneNumber]);

  // Khởi tạo tra cứu nếu có initialPhone
  useEffect(() => {
    if (initialPhone) {
      setPhoneNumber(initialPhone);
      handleSearch(initialPhone);
    }
  }, [initialPhone, isOpen, handleSearch]);

  // LẮNG NGHE REALTIME EVENT TỪ QUẦY THU NGÂN / POS CỦA TIỆM
  useEffect(() => {
    if (!isOpen) return;

    const handleRealtimeUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Order>;
      const updatedOrder = customEvent.detail;
      const cleanPhone = phoneNumber.trim().replace(/\D/g, '');

      // Nếu đơn vừa cập nhật thuộc số điện thoại đang xem, tự động reload ngay!
      if (!cleanPhone || updatedOrder.customerPhone.replace(/\D/g, '') === cleanPhone) {
        handleSearch(cleanPhone);
      }
    };

    const handleStoragePing = (e: StorageEvent) => {
      if (e.key === 'bake_sip_realtime_ping_v5') {
        const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
        if (cleanPhone) {
          handleSearch(cleanPhone);
        }
      }
    };

    window.addEventListener('bake_sip_order_updated', handleRealtimeUpdate);
    window.addEventListener('storage', handleStoragePing);

    return () => {
      window.removeEventListener('bake_sip_order_updated', handleRealtimeUpdate);
      window.removeEventListener('storage', handleStoragePing);
    };
  }, [isOpen, phoneNumber, handleSearch]);

  if (!isOpen) return null;

  const handleQuickSelect = (phone: string) => {
    setPhoneNumber(phone);
    handleSearch(phone);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentTierInfo = searchedCustomer ? TIER_CONFIG[searchedCustomer.tier] : null;

  const getNextTierProgress = () => {
    if (!searchedCustomer) return null;
    const spent = searchedCustomer.totalSpent;
    if (spent < TIER_CONFIG.SILVER.minSpent) {
      const remaining = TIER_CONFIG.SILVER.minSpent - spent;
      const percent = Math.min(100, Math.round((spent / TIER_CONFIG.SILVER.minSpent) * 100));
      return { nextName: 'Hội Viên Bạc', remaining, percent };
    }
    if (spent < TIER_CONFIG.GOLD.minSpent) {
      const remaining = TIER_CONFIG.GOLD.minSpent - spent;
      const percent = Math.min(100, Math.round(((spent - TIER_CONFIG.SILVER.minSpent) / (TIER_CONFIG.GOLD.minSpent - TIER_CONFIG.SILVER.minSpent)) * 100));
      return { nextName: 'Hội Viên Vàng', remaining, percent };
    }
    if (spent < TIER_CONFIG.DIAMOND.minSpent) {
      const remaining = TIER_CONFIG.DIAMOND.minSpent - spent;
      const percent = Math.min(100, Math.round(((spent - TIER_CONFIG.GOLD.minSpent) / (TIER_CONFIG.DIAMOND.minSpent - TIER_CONFIG.GOLD.minSpent)) * 100));
      return { nextName: 'VIP Kim Cương', remaining, percent };
    }
    return { nextName: 'Hạng Cao Nhất (VIP Kim Cương)', remaining: 0, percent: 100 };
  };

  const nextTier = getNextTierProgress();

  const filteredTransactions = transactions.filter((tx) => {
    if (filterTxType === 'EARN') return tx.source === 'EARN';
    if (filterTxType === 'REDEEM') return tx.source === 'REDEEM';
    return true;
  });

  // Hỗ trợ hiển thị thanh tiến trình 4 bước
  const getStepStatus = (orderStatus: OrderStatus, stepNumber: number) => {
    const currentStep = ORDER_STATUS_MAP[orderStatus]?.step || 1;
    if (orderStatus === 'cancelled') return 'cancelled';
    if (currentStep > stepNumber) return 'completed';
    if (currentStep === stepNumber) return 'current';
    return 'upcoming';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      <div onClick={onClose} className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity" />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-xs">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Tra Cứu Đơn Hàng & Thẻ Hội Viên
                </h3>
                <span className="text-[11px] sm:text-xs text-stone-500">
                  Cập nhật trạng thái đơn & tích điểm thời gian thực (Realtime)
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
            {/* Phone Input Bar */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="Nhập số điện thoại đặt hàng (VD: 0988111222)..."
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSearch()}
                  className="px-4 sm:px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  Tra Cứu
                </button>
              </div>

              {/* Sample Quick Clicks */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 pt-1">
                <span>Gợi ý số mẫu:</span>
                <button
                  type="button"
                  onClick={() => handleQuickSelect('0988111222')}
                  className="px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-mono font-medium transition-colors cursor-pointer"
                >
                  0988111222 (Đơn tạm + VIP)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect('0912345678')}
                  className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono font-medium transition-colors cursor-pointer"
                >
                  0912345678
                </button>
              </div>
            </div>

            {/* Results Area */}
            {hasSearched && (
              <div className="space-y-4 animate-fade-in">
                {/* 2 Tabs: Đơn hàng vs Thẻ thành viên */}
                <div className="flex border-b border-stone-200 gap-4 text-xs sm:text-sm font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className={`pb-2.5 flex items-center gap-1.5 transition-all cursor-pointer border-b-2 -mb-px ${
                      activeTab === 'orders'
                        ? 'border-amber-600 text-amber-800'
                        : 'border-transparent text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Đơn Hàng Của Tôi ({customerOrders.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('card')}
                    className={`pb-2.5 flex items-center gap-1.5 transition-all cursor-pointer border-b-2 -mb-px ${
                      activeTab === 'card'
                        ? 'border-amber-600 text-amber-800'
                        : 'border-transparent text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Thẻ Hội Viên & Điểm Thưởng</span>
                  </button>
                </div>

                {/* TAB 1: DANH SÁCH ĐƠN HÀNG */}
                {activeTab === 'orders' && (
                  <div className="space-y-4">
                    {customerOrders.length === 0 ? (
                      <div className="p-8 text-center bg-stone-50 border border-stone-200 rounded-3xl space-y-2">
                        <Package className="w-10 h-10 text-stone-400 mx-auto" />
                        <h4 className="font-bold text-stone-800 text-sm">Chưa có đơn hàng nào</h4>
                        <p className="text-xs text-stone-500 max-w-xs mx-auto">
                          Số điện thoại này chưa có đơn hàng nào được ghi nhận. Hãy đặt món ngay để nhận mã đơn nhé!
                        </p>
                        {onStartOrder && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onStartOrder();
                            }}
                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-amber-300 rounded-xl text-xs font-bold hover:bg-stone-800 cursor-pointer"
                          >
                            <span>Xem Menu & Đặt Bánh Ngay</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {customerOrders.map((order) => {
                          const statusInfo = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.pending;
                          const isCopiedOrderCode = copiedKey === `code-${order.orderCode}`;
                          const isCopiedBankAcc = copiedKey === `bank-${order.id}`;
                          const isCopiedAmount = copiedKey === `amt-${order.id}`;

                          const step1State = getStepStatus(order.status, 1);
                          const step2State = getStepStatus(order.status, 2);
                          const step3State = getStepStatus(order.status, 3);
                          const step4State = getStepStatus(order.status, 4);

                          // VietQR URL động
                          const vietQrUrl = `https://img.vietqr.io/image/MB-${SHOP_CONFIG.bank.accountNumber}-compact2.png?amount=${order.orderTotal}&addInfo=${encodeURIComponent(order.orderCode)}&accountName=${encodeURIComponent(SHOP_CONFIG.bank.accountHolder)}`;

                          return (
                            <div
                              key={order.id}
                              className="border border-stone-200 rounded-3xl p-4 sm:p-5 bg-white hover:border-amber-400 transition-all space-y-4 shadow-sm"
                            >
                              {/* Order Card Top: Code & Status */}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-lg sm:text-xl text-stone-900 tracking-wider">
                                    {order.orderCode}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(order.orderCode, `code-${order.orderCode}`)}
                                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                                    title="Sao chép mã đơn"
                                  >
                                    {isCopiedOrderCode ? (
                                      <Check className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                  <span className="text-[11px] text-stone-400">
                                    &bull; {formatDate(order.createdAt)}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}
                                  >
                                    {statusInfo.label}
                                  </span>
                                </div>
                              </div>

                              {/* STEPPER TIẾN TRÌNH 4 BƯỚC THỜI GIAN THỰC */}
                              <div className="bg-stone-50/80 p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                                  <span>Tiến độ xử lý đơn hàng</span>
                                  <span className="text-amber-800 text-[11px] font-mono">
                                    {order.status === 'completed'
                                      ? 'Đã hoàn tất 100%'
                                      : `Giai đoạn ${statusInfo.step}/4`}
                                  </span>
                                </div>

                                {/* Stepper Icons & Line */}
                                <div className="relative flex items-center justify-between px-2 pt-2">
                                  {/* Connector Line */}
                                  <div className="absolute left-6 right-6 top-6 -translate-y-1/2 h-1 bg-stone-200 -z-0">
                                    <div
                                      className="h-full bg-amber-500 transition-all duration-700"
                                      style={{
                                        width:
                                          order.status === 'completed'
                                            ? '100%'
                                            : order.status === 'shipping'
                                            ? '66%'
                                            : order.status === 'confirmed'
                                            ? '33%'
                                            : '0%',
                                      }}
                                    />
                                  </div>

                                  {/* Step 1: Đơn tạm */}
                                  <div className="flex flex-col items-center gap-1 z-10 text-center">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                        step1State === 'completed'
                                          ? 'bg-amber-500 text-stone-950'
                                          : step1State === 'current'
                                          ? 'bg-amber-500 text-stone-950 ring-4 ring-amber-200 animate-pulse'
                                          : 'bg-stone-200 text-stone-500'
                                      }`}
                                    >
                                      <Clock className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] sm:text-[11px] font-medium text-stone-700 mt-1 max-w-[70px] leading-tight">
                                      Đơn tạm
                                    </span>
                                  </div>

                                  {/* Step 2: Chuẩn bị bánh */}
                                  <div className="flex flex-col items-center gap-1 z-10 text-center">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                        step2State === 'completed'
                                          ? 'bg-amber-500 text-stone-950'
                                          : step2State === 'current'
                                          ? 'bg-sky-600 text-white ring-4 ring-sky-200 animate-pulse'
                                          : 'bg-stone-200 text-stone-500'
                                      }`}
                                    >
                                      <ChefHat className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] sm:text-[11px] font-medium text-stone-700 mt-1 max-w-[70px] leading-tight">
                                      Làm bánh
                                    </span>
                                  </div>

                                  {/* Step 3: Đang giao */}
                                  <div className="flex flex-col items-center gap-1 z-10 text-center">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                        step3State === 'completed'
                                          ? 'bg-amber-500 text-stone-950'
                                          : step3State === 'current'
                                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 animate-pulse'
                                          : 'bg-stone-200 text-stone-500'
                                      }`}
                                    >
                                      <Truck className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] sm:text-[11px] font-medium text-stone-700 mt-1 max-w-[70px] leading-tight">
                                      Đang giao
                                    </span>
                                  </div>

                                  {/* Step 4: Hoàn tất */}
                                  <div className="flex flex-col items-center gap-1 z-10 text-center">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                        step4State === 'completed' || step4State === 'current'
                                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-200'
                                          : 'bg-stone-200 text-stone-500'
                                      }`}
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] sm:text-[11px] font-medium text-stone-700 mt-1 max-w-[70px] leading-tight">
                                      Hoàn tất
                                    </span>
                                  </div>
                                </div>

                                <div className="text-xs text-stone-600 bg-white p-2.5 rounded-xl border border-stone-200/60 mt-2">
                                  {statusInfo.description}
                                </div>
                              </div>

                              {/* KHUNG THANH TOÁN VIETQR KHI TIỆM ĐÃ DUYỆT ĐƠN (GIAI ĐOẠN 2 HOẶC 3) */}
                              {(order.status === 'confirmed' || order.status === 'shipping') && (
                                <div className="rounded-2xl border overflow-hidden transition-all">
                                  {order.paymentStatus === 'unpaid' ? (
                                    <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-stone-50 p-4 sm:p-5 border-amber-200 space-y-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center">
                                            <QrCode className="w-4 h-4" />
                                          </div>
                                          <div>
                                            <h5 className="font-serif font-bold text-stone-900 text-sm">
                                              Thanh Toán Chuyển Khoản VietQR
                                            </h5>
                                            <span className="text-[11px] text-stone-500">
                                              Tiệm đã nhận đơn, bạn có thể quét mã chuyển tiền ngay
                                            </span>
                                          </div>
                                        </div>

                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                                          Chờ Thanh Toán
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                                        {/* QR Code Image */}
                                        <div className="sm:col-span-5 flex flex-col items-center justify-center bg-white p-3 rounded-2xl border border-amber-200 shadow-2xs">
                                          <img
                                            src={vietQrUrl}
                                            alt="VietQR Chuyển Khoản"
                                            className="w-44 h-44 object-contain"
                                            loading="lazy"
                                          />
                                          <span className="text-[10px] text-stone-400 mt-1">
                                            Quét bằng app ngân hàng bất kỳ
                                          </span>
                                        </div>

                                        {/* Bank Details */}
                                        <div className="sm:col-span-7 space-y-2.5 text-xs text-stone-700">
                                          <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-stone-200">
                                            <span className="text-stone-500">Ngân hàng:</span>
                                            <strong className="text-stone-900">{SHOP_CONFIG.bank.bankName}</strong>
                                          </div>

                                          <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-stone-200">
                                            <span className="text-stone-500">Số tài khoản:</span>
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-mono font-bold text-amber-800">
                                                {SHOP_CONFIG.bank.accountNumber}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => handleCopy(SHOP_CONFIG.bank.accountNumber, `bank-${order.id}`)}
                                                className="p-1 rounded text-stone-400 hover:text-stone-700 cursor-pointer"
                                                title="Sao chép STK"
                                              >
                                                {isCopiedBankAcc ? (
                                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                ) : (
                                                  <Copy className="w-3.5 h-3.5" />
                                                )}
                                              </button>
                                            </div>
                                          </div>

                                          <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-stone-200">
                                            <span className="text-stone-500">Số tiền:</span>
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-mono font-extrabold text-stone-900 text-sm">
                                                {formatCurrency(order.orderTotal)}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => handleCopy(order.orderTotal.toString(), `amt-${order.id}`)}
                                                className="p-1 rounded text-stone-400 hover:text-stone-700 cursor-pointer"
                                                title="Sao chép số tiền"
                                              >
                                                {isCopiedAmount ? (
                                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                ) : (
                                                  <Copy className="w-3.5 h-3.5" />
                                                )}
                                              </button>
                                            </div>
                                          </div>

                                          <div className="flex items-center justify-between bg-amber-100/70 p-2 rounded-xl border border-amber-300">
                                            <span className="text-amber-900 font-semibold">Nội dung CK:</span>
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-mono font-black text-amber-900 text-sm">
                                                {order.orderCode}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => handleCopy(order.orderCode, `code-${order.orderCode}`)}
                                                className="p-1 rounded text-amber-800 hover:text-amber-950 cursor-pointer"
                                                title="Sao chép nội dung"
                                              >
                                                {isCopiedOrderCode ? (
                                                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                                                ) : (
                                                  <Copy className="w-3.5 h-3.5" />
                                                )}
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="text-[11px] text-stone-500 italic bg-white/80 p-2 rounded-xl border border-amber-200/60">
                                        💡 Giữ nguyên nội dung chuyển khoản là <strong>{order.orderCode}</strong>. Tiệm sẽ bấm xác nhận đã nhận tiền và màn hình này sẽ tự động cập nhật ngay tức thì!
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-emerald-50 border-emerald-200 p-4 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 text-xs">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                          <Check className="w-4 h-4" />
                                        </div>
                                        <div>
                                          <div className="font-bold text-sm text-emerald-950">
                                            ✓ Tiệm đã nhận chuyển khoản thành công
                                          </div>
                                          <div className="text-[11px] text-emerald-800">
                                            Đã thanh toán {formatCurrency(order.orderTotal)} &bull; Tiệm đang chuẩn bị món giao sớm nhất cho bạn!
                                          </div>
                                        </div>
                                      </div>

                                      <span className="px-2.5 py-1 bg-white text-emerald-800 border border-emerald-300 rounded-full font-bold text-[10px] shrink-0">
                                        ĐÃ THANH TOÁN
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Giao hàng Info nếu có */}
                              {order.shipperInfo && (
                                <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2">
                                  <Truck className="w-4 h-4 shrink-0 text-indigo-600" />
                                  <span><strong>Thông tin giao hàng:</strong> {order.shipperInfo}</span>
                                </div>
                              )}

                              {/* Danh sách món chi tiết */}
                              <div className="divide-y divide-stone-100 text-xs space-y-1.5 pt-1">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="pt-2 flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="font-semibold text-stone-900">
                                        {item.quantity}x {item.productName}
                                      </div>
                                      {item.optionsSummary && (
                                        <div className="text-[11px] text-amber-800 font-medium">
                                          {item.optionsSummary}
                                        </div>
                                      )}
                                      {item.itemNote && (
                                        <div className="text-[11px] text-stone-500 italic flex items-center gap-1 mt-0.5">
                                          <MessageSquare className="w-3 h-3 text-amber-700 shrink-0" />
                                          <span>{item.itemNote}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="font-mono font-bold text-stone-900 shrink-0">
                                      {formatCurrency(item.totalPrice)}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Order Bottom Financials & Zalo Action */}
                              <div className="border-t border-stone-100 pt-3 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <div className="text-xs text-stone-500">
                                    Tổng thanh toán: <strong className="text-base font-extrabold text-amber-800 font-mono">{formatCurrency(order.orderTotal)}</strong>
                                  </div>
                                  <div className="text-[11px] text-emerald-700 font-medium">
                                    {order.status === 'completed'
                                      ? `✓ Đã tích +${order.earnedPoints} điểm thưởng vào thẻ`
                                      : `Dự kiến tích +${order.earnedPoints} điểm khi hoàn tất`}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {order.status === 'completed' ? (
                                    <button
                                      type="button"
                                      onClick={() => setActiveTab('card')}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                      <span>Xem Thẻ & Điểm</span>
                                    </button>
                                  ) : (
                                    <a
                                      href={`https://zalo.me/${SHOP_CONFIG.zaloPhone}?text=${encodeURIComponent(
                                        `Chào tiệm ${SHOP_CONFIG.shopName}, mình muốn hỏi về đơn hàng ${order.orderCode} (${order.customerName} - ${order.customerPhone})`
                                      )}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                    >
                                      <span>Nhắn Zalo Tiệm</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: THẺ THÀNH VIÊN & SỔ CÁI ĐIỂM */}
                {activeTab === 'card' && (
                  <div className="space-y-5">
                    {searchedCustomer ? (
                      <>
                        {/* 3D Holographic Card */}
                        <div
                          className={`relative rounded-3xl p-5 sm:p-6 text-white shadow-2xl bg-gradient-to-br ${
                            currentTierInfo?.gradientClass || 'from-stone-800 to-stone-950'
                          } border border-white/20 overflow-hidden group`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-60 pointer-events-none" />

                          <div className="relative z-10 flex flex-col justify-between min-h-[175px]">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-amber-300 font-bold block">
                                  {SHOP_CONFIG.shopName.toUpperCase()} &bull; MEMBER PASS
                                </span>
                                <h4 className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-white mt-1">
                                  {searchedCustomer.name}
                                </h4>
                                <span className="text-xs font-mono text-white/80 block">
                                  {formatPhone(searchedCustomer.phone)}
                                </span>
                              </div>

                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md text-amber-200 border border-white/30">
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                {currentTierInfo?.label}
                              </span>
                            </div>

                            <div className="flex items-end justify-between border-t border-white/20 pt-3">
                              <div>
                                <span className="text-[10px] text-white/70 block uppercase tracking-wider font-semibold">
                                  Điểm Khả Dụng Hiện Có
                                </span>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                  <span className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight">
                                    {searchedCustomer.availablePoints}
                                  </span>
                                  <span className="text-xs text-white font-medium">
                                    điểm (= <strong className="text-amber-300">{formatCurrency(searchedCustomer.availablePoints * SHOP_CONFIG.pointToVndRatio)}</strong>)
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end">
                                <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                                  <QrCode className="w-5 h-5" />
                                </div>
                                <span className="text-[9px] text-white/70 mt-0.5">Quét tại quầy</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tier Progress */}
                        {nextTier && nextTier.remaining > 0 && (
                          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-stone-600 font-medium">
                                Tiến trình lên <strong className="text-stone-900">{nextTier.nextName}</strong>:
                              </span>
                              <span className="font-bold text-amber-800">
                                Mua thêm {formatCurrency(nextTier.remaining)}
                              </span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
                                style={{ width: `${nextTier.percent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Transaction Ledger */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-serif font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-stone-500" />
                              Lịch Sử Biến Động Điểm
                            </h4>

                            <div className="flex items-center gap-1 text-[11px] bg-stone-100 p-0.5 rounded-xl">
                              <button
                                type="button"
                                onClick={() => setFilterTxType('ALL')}
                                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                                  filterTxType === 'ALL'
                                    ? 'bg-white font-bold text-stone-900 shadow-xs'
                                    : 'text-stone-600 hover:text-stone-900'
                                }`}
                              >
                                Tất cả
                              </button>
                              <button
                                type="button"
                                onClick={() => setFilterTxType('EARN')}
                                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                                  filterTxType === 'EARN'
                                    ? 'bg-white font-bold text-emerald-800 shadow-xs'
                                    : 'text-stone-600 hover:text-stone-900'
                                }`}
                              >
                                Tích (+)
                              </button>
                              <button
                                type="button"
                                onClick={() => setFilterTxType('REDEEM')}
                                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                                  filterTxType === 'REDEEM'
                                    ? 'bg-white font-bold text-rose-800 shadow-xs'
                                    : 'text-stone-600 hover:text-stone-900'
                                }`}
                              >
                                Dùng (-)
                              </button>
                            </div>
                          </div>

                          {filteredTransactions.length === 0 ? (
                            <div className="p-5 text-center text-xs text-stone-500 border border-stone-200 rounded-2xl bg-stone-50">
                              Chưa có giao dịch điểm nào trong danh mục này.
                            </div>
                          ) : (
                            <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white max-h-48 overflow-y-auto">
                              {filteredTransactions.map((tx) => {
                                const isPositive = tx.points > 0;
                                return (
                                  <div key={tx.id} className="p-3 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                                          isPositive
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-rose-100 text-rose-700'
                                        }`}
                                      >
                                        {isPositive ? (
                                          <ArrowUpRight className="w-4 h-4" />
                                        ) : (
                                          <ArrowDownRight className="w-4 h-4" />
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-semibold text-stone-900">{tx.note}</div>
                                        <div className="text-[10px] text-stone-400">
                                          {formatDate(tx.createdAt)}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <span
                                        className={`font-mono font-bold text-xs sm:text-sm block ${
                                          isPositive ? 'text-emerald-600' : 'text-rose-600'
                                        }`}
                                      >
                                        {isPositive ? `+${tx.points}` : tx.points} điểm
                                      </span>
                                      <span className="text-[10px] text-stone-400">
                                        Dư: {tx.balanceAfter} điểm
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center bg-stone-50 border border-stone-200 rounded-3xl space-y-2">
                        <Award className="w-10 h-10 text-stone-400 mx-auto" />
                        <h4 className="font-bold text-stone-800 text-sm">Chưa có thông tin tích điểm</h4>
                        <p className="text-xs text-stone-500 max-w-xs mx-auto">
                          Khi đơn hàng của số điện thoại này được tiệm xác nhận hoàn tất, thẻ tích điểm sẽ tự động kích hoạt ngay!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-[11px] text-stone-500 shrink-0">
            <span>Tra cứu theo Số Điện Thoại &bull; Cập nhật Realtime</span>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-200 text-stone-700 font-semibold transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
