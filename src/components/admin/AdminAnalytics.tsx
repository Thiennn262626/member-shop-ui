import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Banknote,
  Sparkles,
  Users,
  Award,
  ArrowUpRight,
  Package,
  Calendar,
} from 'lucide-react';
import { mockDb, TIER_CONFIG } from '../../services/mockDb';
import { formatCurrency, formatPhone } from '../../utils/format';

export const AdminAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'today' | '7days' | 'month' | 'all'>('7days');

  const orders = useMemo(() => mockDb.getOrders(), []);
  const customers = useMemo(() => mockDb.getCustomers(), []);
  const products = useMemo(() => mockDb.getProducts(), []);

  // Tính toán doanh thu & chỉ số
  const completedOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'completed');
  }, [orders]);

  const totalRevenue = useMemo(() => {
    return completedOrders.reduce((sum, o) => sum + o.orderTotal, 0);
  }, [completedOrders]);

  const totalPointsEarned = useMemo(() => {
    return completedOrders.reduce((sum, o) => sum + o.earnedPoints, 0);
  }, [completedOrders]);

  const averageOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

  // Doanh thu theo phương thức thanh toán
  const paymentStats = useMemo(() => {
    let vietqrTotal = 0;
    let cashTotal = 0;
    completedOrders.forEach((o) => {
      if (o.paymentMethod === 'vietqr') {
        vietqrTotal += o.orderTotal;
      } else {
        cashTotal += o.orderTotal;
      }
    });

    const total = vietqrTotal + cashTotal || 1;
    const vietqrPercent = Math.round((vietqrTotal / total) * 100);
    const cashPercent = 100 - vietqrPercent;

    return {
      vietqrTotal,
      cashTotal,
      vietqrPercent,
      cashPercent,
    };
  }, [completedOrders]);

  // Top món bán chạy
  const topSellingProducts = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number; image?: string; category?: string }>();

    completedOrders.forEach((o) => {
      o.items.forEach((item) => {
        const existing = map.get(item.productId) || {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += item.totalPrice;
        map.set(item.productId, existing);
      });
    });

    const list = Array.from(map.entries()).map(([id, data]) => {
      const prod = products.find((p) => p.id === id);
      return {
        id,
        name: data.name,
        quantity: data.quantity,
        revenue: data.revenue,
        imageUrl: prod?.imageUrl || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=120',
        category: prod?.category || 'Bánh',
      };
    });

    list.sort((a, b) => b.quantity - a.quantity);
    return list.slice(0, 5);
  }, [completedOrders, products]);

  // Top khách hàng VIP
  const topVipCustomers = useMemo(() => {
    const list = [...customers];
    list.sort((a, b) => b.totalSpent - a.totalSpent);
    return list.slice(0, 5);
  }, [customers]);

  // Mock dữ liệu biểu đồ 7 ngày gần nhất (doanh thu tương quan)
  const chartDays = [
    { day: 'T2', amount: 850000, height: '45%' },
    { day: 'T3', amount: 1250000, height: '65%' },
    { day: 'T4', amount: 980000, height: '52%' },
    { day: 'T5', amount: 1420000, height: '75%' },
    { day: 'T6', amount: 1890000, height: '90%' },
    { day: 'T7', amount: 2450000, height: '100%' },
    { day: 'CN (Hôm nay)', amount: totalRevenue || 1650000, height: '82%' },
  ];

  return (
    <div className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-6 font-sans">
      {/* Header & Bộ lọc thời gian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="font-serif font-extrabold text-stone-900 text-lg sm:text-xl flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <span>Báo Cáo & Thống Kê Doanh Thu Tiệm</span>
          </h2>
          <span className="text-xs text-stone-500">
            Theo dõi tổng quan tài chính, tăng trưởng bán hàng và khách hàng thân thiết
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTimeRange('today')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              timeRange === 'today' ? 'bg-white font-bold text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('7days')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              timeRange === '7days' ? 'bg-white font-bold text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            7 ngày qua
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              timeRange === 'month' ? 'bg-white font-bold text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Tháng này
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              timeRange === 'all' ? 'bg-white font-bold text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Tất cả
          </button>
        </div>
      </div>

      {/* 4 THẺ CHỈ SỐ KPI CHÍNH */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh thu */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Tổng Doanh Thu</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="font-serif font-black text-2xl sm:text-3xl text-stone-900 font-mono">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Tăng +18.4% so với tuần trước</span>
          </div>
        </div>

        {/* Số đơn hoàn tất */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Đơn Hàng Phục Vụ</span>
            <div className="w-9 h-9 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="font-serif font-black text-2xl sm:text-3xl text-stone-900 font-mono">
            {completedOrders.length} <span className="text-sm font-sans font-normal text-stone-500">đơn</span>
          </div>
          <div className="text-[11px] text-stone-500">
            Tổng {orders.length} đơn được khởi tạo trong hệ thống
          </div>
        </div>

        {/* Giá trị trung bình đơn (AOV) */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Giá Trị TB Đơn (AOV)</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="font-serif font-black text-2xl sm:text-3xl text-stone-900 font-mono">
            {formatCurrency(averageOrderValue)}
          </div>
          <div className="text-[11px] text-stone-500">
            Trung bình mỗi khách mua ~2.4 món
          </div>
        </div>

        {/* Điểm thưởng đã cấp */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Điểm Thưởng Tích Lũy</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="font-serif font-black text-2xl sm:text-3xl text-amber-800 font-mono">
            +{totalPointsEarned} <span className="text-sm font-sans font-normal text-stone-500">điểm</span>
          </div>
          <div className="text-[11px] text-purple-700 font-medium">
            Tương đương {formatCurrency(totalPointsEarned * 1000)} tiền ưu đãi
          </div>
        </div>
      </div>

      {/* BIỂU ĐỒ DOANH THU & CƠ CẤU THANH TOÁN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Biểu đồ doanh thu 7 ngày gần nhất (8/12) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Xu Hướng Doanh Thu 7 Ngày Gần Nhất</span>
              </h3>
              <span className="text-xs text-stone-400">Doanh thu đạt đỉnh vào cuối tuần (Thứ 7 & Chủ Nhật)</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              Đang tăng trưởng
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-6 pb-2">
            <div className="flex items-end justify-between gap-2 sm:gap-4 h-48 px-2 border-b border-stone-100">
              {chartDays.map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatCurrency(bar.amount)}
                  </span>
                  <div className="w-full max-w-[48px] bg-stone-100 rounded-t-xl overflow-hidden h-full flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-amber-600 to-amber-400 group-hover:from-amber-500 group-hover:to-amber-300 rounded-t-xl transition-all duration-500 shadow-xs"
                      style={{ height: bar.height }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-stone-600 group-hover:text-amber-800 transition-colors">
                    {bar.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cơ cấu thanh toán VietQR vs Tiền mặt (4/12) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-sky-600" />
              <span>Cơ Cấu Phương Thức Thanh Toán</span>
            </h3>
            <span className="text-xs text-stone-400">Tỷ lệ thanh toán không tiền mặt của giới trẻ</span>
          </div>

          <div className="space-y-4 py-2">
            {/* Chuyển khoản VietQR */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-sky-600" />
                  Chuyển Khoản VietQR MBBank
                </span>
                <span className="font-mono text-sky-700">{paymentStats.vietqrPercent}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${paymentStats.vietqrPercent}%` }}
                />
              </div>
              <span className="text-[11px] text-stone-400 block font-mono">
                {formatCurrency(paymentStats.vietqrTotal)}
              </span>
            </div>

            {/* Tiền mặt tại quầy */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                <span className="flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  Tiền Mặt Tại Quầy POS
                </span>
                <span className="font-mono text-emerald-700">{paymentStats.cashPercent}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                  style={{ width: `${paymentStats.cashPercent}%` }}
                />
              </div>
              <span className="text-[11px] text-stone-400 block font-mono">
                {formatCurrency(paymentStats.cashTotal)}
              </span>
            </div>
          </div>

          <div className="p-3 bg-sky-50 border border-sky-100 rounded-2xl text-[11px] text-sky-900">
            💡 Tỷ lệ VietQR chiếm trên 60% cho thấy tệp khách 14-35 tuổi rất ưa chuộng thanh toán quét mã nhanh.
          </div>
        </div>
      </div>

      {/* TOP MÓN BÁN CHẠY & TOP KHÁCH HÀNG VIP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Top 5 món bán chạy (7/12) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-600" />
              <span>Top 5 Món Bán Chạy Nhất Tiệm</span>
            </h3>
            <span className="text-xs text-stone-400">Dựa trên số lượng đã giao</span>
          </div>

          {topSellingProducts.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400">Chưa có dữ liệu bán hàng.</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {topSellingProducts.map((p, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 font-mono font-black text-stone-400 text-center">
                      #{idx + 1}
                    </span>
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <h5 className="font-bold text-stone-900 truncate">{p.name}</h5>
                      <span className="text-[11px] text-stone-400">{p.category}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <strong className="font-mono text-stone-900 text-xs block">
                      {p.quantity} phần
                    </strong>
                    <span className="text-[11px] text-amber-800 font-mono font-semibold">
                      {formatCurrency(p.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top khách VIP chi tiêu nhiều nhất (5/12) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Hội Viên Thân Thiết Hàng Đầu</span>
            </h3>
            <span className="text-xs text-stone-400">VIP Loyalty</span>
          </div>

          {topVipCustomers.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400">Chưa có dữ liệu hội viên.</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {topVipCustomers.map((c, idx) => {
                const tierInfo = TIER_CONFIG[c.tier];
                return (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-stone-900 truncate">{c.name}</h5>
                        <span className="text-[11px] text-stone-400 font-mono">
                          {formatPhone(c.phone)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-50 text-purple-800 border border-purple-200">
                        {tierInfo.label}
                      </span>
                      <div className="font-mono font-bold text-amber-800 text-[11px] mt-0.5">
                        {formatCurrency(c.totalSpent)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
