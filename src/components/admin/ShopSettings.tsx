import React, { useState, useEffect } from 'react';
import {
  Store,
  QrCode,
  Award,
  Save,
  CheckCircle2,
  Phone,
  MapPin,
  MessageSquare,
  Truck,
  Plus,
  Trash2,
} from 'lucide-react';
import { storeService, SHOP_CONFIG } from '../../services/storeService';
import type { ShippingTier } from '../../types';
import { formatCurrency } from '../../utils/format';

export const ShopSettings: React.FC = () => {
  const [shopName, setShopName] = useState(SHOP_CONFIG.shopName);
  const [tagline, setTagline] = useState(SHOP_CONFIG.tagline);
  const [hotline, setHotline] = useState(SHOP_CONFIG.hotline);
  const [zaloPhone, setZaloPhone] = useState(SHOP_CONFIG.zaloPhone);
  const [address, setAddress] = useState(SHOP_CONFIG.address);

  // Bank Info
  const [bankName, setBankName] = useState(SHOP_CONFIG.bank.bankName);
  const [accountNumber, setAccountNumber] = useState(SHOP_CONFIG.bank.accountNumber);
  const [accountHolder, setAccountHolder] = useState(SHOP_CONFIG.bank.accountHolder);

  // Loyalty Program Config
  const [spendToPointRatio, setSpendToPointRatio] = useState<number>(
    SHOP_CONFIG.spendToPointRatio || 10000
  );
  const [pointToVndRatio, setPointToVndRatio] = useState<number>(
    SHOP_CONFIG.pointToVndRatio || 1000
  );

  // Delivery Config
  const [deliveryEnabled, setDeliveryEnabled] = useState(
    SHOP_CONFIG.delivery?.enabled !== undefined ? SHOP_CONFIG.delivery.enabled : true
  );
  const [maxDistanceKm, setMaxDistanceKm] = useState(SHOP_CONFIG.delivery?.maxDistanceKm || 10);
  const [areaNote, setAreaNote] = useState(
    SHOP_CONFIG.delivery?.areaNote ||
      'Chỉ nhận giao hàng trong bán kính 10km quanh khu vực Phú Nhuận & lân cận'
  );
  const [shippingTiers, setShippingTiers] = useState<ShippingTier[]>(
    SHOP_CONFIG.delivery?.tiers || [
      { id: 't1', minOrder: 0, maxOrder: 99999, fee: 20000, label: 'Đơn dưới 100k (Phí 20k)' },
      { id: 't2', minOrder: 100000, maxOrder: 199999, fee: 10000, label: 'Đơn 100k - 200k (Phí 10k)' },
      { id: 't3', minOrder: 200000, fee: 0, label: 'Đơn từ 200k trở lên (Freeship)' },
    ]
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    storeService.getShopConfig().then((cfg) => {
      if (isMounted && cfg) {
        setShopName(cfg.shopName);
        setTagline(cfg.tagline);
        setHotline(cfg.hotline);
        setZaloPhone(cfg.zaloPhone);
        setAddress(cfg.address);
        setBankName(cfg.bank.bankName);
        setAccountNumber(cfg.bank.accountNumber);
        setAccountHolder(cfg.bank.accountHolder);
        setSpendToPointRatio(cfg.spendToPointRatio || 10000);
        setPointToVndRatio(cfg.pointToVndRatio || 1000);
        if (cfg.delivery) {
          setDeliveryEnabled(cfg.delivery.enabled !== undefined ? cfg.delivery.enabled : true);
          setMaxDistanceKm(cfg.delivery.maxDistanceKm || 10);
          setAreaNote(cfg.delivery.areaNote || '');
          if (cfg.delivery.tiers) setShippingTiers(cfg.delivery.tiers);
        }
      }
    }).catch(console.error);
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddTier = () => {
    const newTier: ShippingTier = {
      id: `tier-${Date.now()}`,
      minOrder: 150000,
      fee: 15000,
      label: 'Mốc phí ship mới',
    };
    setShippingTiers([...shippingTiers, newTier]);
  };

  const handleUpdateTier = (index: number, updates: Partial<ShippingTier>) => {
    const updated = [...shippingTiers];
    updated[index] = { ...updated[index], ...updates };
    setShippingTiers(updated);
  };

  const handleRemoveTier = (index: number) => {
    setShippingTiers(shippingTiers.filter((_, idx) => idx !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await storeService.updateShopConfig({
        shopName,
        tagline,
        hotline,
        zaloPhone,
        address,
        spendToPointRatio: Number(spendToPointRatio) || 10000,
        pointToVndRatio: Number(pointToVndRatio) || 1000,
        bank: {
          bankName,
          accountNumber,
          accountHolder,
        },
        delivery: {
          enabled: deliveryEnabled,
          maxDistanceKm: Number(maxDistanceKm) || 10,
          areaNote,
          tiers: shippingTiers,
        },
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 p-3 sm:p-6 max-w-5xl mx-auto w-full space-y-6 font-sans">
      {/* Toast Notification */}
      {savedSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-amber-300 px-4 py-3 rounded-2xl shadow-xl border border-stone-700 flex items-center gap-2 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Đã lưu cấu hình cửa hàng thành công!</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
        <h2 className="font-serif font-extrabold text-stone-900 text-lg sm:text-xl flex items-center gap-2">
          <Store className="w-5 h-5 text-amber-600" />
          <span>Cài Đặt Cửa Hàng, Giao Hàng & VietQR</span>
        </h2>
        <span className="text-xs text-stone-500">
          Tùy chỉnh thông tin liên hệ, ngân hàng nhận tiền chuyển khoản, chính sách giao hàng đồng giá theo mốc và tích điểm
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Thông tin liên hệ cửa hàng */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2 border-b border-stone-100 pb-3">
            <Store className="w-4 h-4 text-amber-600" />
            <span>Thông Tin Thương Hiệu & Chi Nhánh</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-stone-700">Tên Cửa Hàng / Tiệm Bánh</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700">Khẩu Hiệu / Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-stone-500" />
                <span>Số Điện Thoại Hotline</span>
              </label>
              <input
                type="text"
                value={hotline}
                onChange={(e) => setHotline(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                <span>Số Điện Thoại Zalo Nhận Đơn Hàng</span>
              </label>
              <input
                type="text"
                value={zaloPhone}
                onChange={(e) => setZaloPhone(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-stone-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Địa Chỉ Tiệm Bánh</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Cấu hình giao hàng & Phí ship đồng giá theo mốc */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Giao Hàng & Phí Ship Đồng Giá Theo Mốc Đơn Hàng</span>
            </h3>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
              <input
                type="checkbox"
                checked={deliveryEnabled}
                onChange={(e) => setDeliveryEnabled(e.target.checked)}
                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              <span>Cho phép nhận đơn giao hàng</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-stone-700">Bán kính giao hàng tối đa (km)</label>
              <input
                type="number"
                min="1"
                max="50"
                value={maxDistanceKm}
                onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
              />
              <span className="text-[10px] text-stone-400">Khuyên dùng: 10km để đảm bảo bánh nóng giòn</span>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700">Ghi chú phạm vi khu vực giao hàng</label>
              <input
                type="text"
                value={areaNote}
                onChange={(e) => setAreaNote(e.target.value)}
                placeholder="VD: Chỉ nhận giao quanh khu vực Phú Nhuận..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Shipping Tiers Table */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-800">
                Các mốc tính phí ship tự động (Đơn đạt mốc nhận mức phí tương ứng)
              </span>
              <button
                type="button"
                onClick={handleAddTier}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Mốc Phí</span>
              </button>
            </div>

            <div className="space-y-2">
              {shippingTiers.map((tier, idx) => (
                <div
                  key={tier.id || idx}
                  className="grid grid-cols-12 gap-2 items-center bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-xs"
                >
                  <div className="col-span-3">
                    <label className="text-[10px] text-stone-500 block">Đơn từ (VNĐ):</label>
                    <input
                      type="number"
                      step="10000"
                      value={tier.minOrder}
                      onChange={(e) => handleUpdateTier(idx, { minOrder: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-white border border-stone-300 rounded-lg font-bold"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="text-[10px] text-stone-500 block">Đến dưới (VNĐ):</label>
                    <input
                      type="number"
                      step="10000"
                      value={tier.maxOrder || ''}
                      placeholder="Không giới hạn"
                      onChange={(e) =>
                        handleUpdateTier(idx, {
                          maxOrder: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-2 py-1 bg-white border border-stone-300 rounded-lg font-medium"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="text-[10px] text-stone-500 block">Phí Ship (0đ = Freeship):</label>
                    <input
                      type="number"
                      step="1000"
                      value={tier.fee}
                      onChange={(e) => handleUpdateTier(idx, { fee: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-white border border-stone-300 rounded-lg font-bold text-amber-800"
                    />
                  </div>

                  <div className="col-span-2 text-right">
                    <span className="text-[11px] font-bold text-stone-700">
                      {tier.fee === 0 ? 'Freeship 🎉' : formatCurrency(tier.fee)}
                    </span>
                  </div>

                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      disabled={shippingTiers.length <= 1}
                      className="p-1 text-stone-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                      title="Xóa mốc"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Tài khoản nhận tiền VietQR */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
              <QrCode className="w-4 h-4 text-sky-600" />
              <span>Tài Khoản Ngân Hàng Nhận Tiền (VietQR)</span>
            </h3>
            <span className="text-[11px] text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full font-bold border border-sky-200">
              Tự động sinh mã VietQR
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-stone-700">Ngân Hàng Tiếp Nhận</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700">Số Tài Khoản</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-amber-800 focus:outline-none focus:border-amber-600 focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700">Tên Chủ Tài Khoản (Không dấu)</label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900 uppercase focus:outline-none focus:border-amber-600 focus:bg-white"
                required
              />
            </div>
          </div>
        </div>

        {/* Card 4: Tùy Chỉnh Chương Trình Đổi Điểm Thưởng */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span>Tùy Chỉnh Chương Trình Điểm Thưởng (Loyalty Points)</span>
            </h3>
            <span className="text-[11px] text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full font-bold border border-purple-200">
              🎁 Tích điểm theo SĐT & Đổi món 0đ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* 1. Mức tiền để tích 1 điểm */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
              <div>
                <label className="font-bold text-stone-900 block mb-1">
                  1. Mức tiền chi tiêu để tích 1 điểm:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={spendToPointRatio}
                    onChange={(e) => setSpendToPointRatio(Math.max(1000, Number(e.target.value)))}
                    className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono font-bold text-stone-900 text-sm focus:outline-none focus:border-amber-600"
                    required
                  />
                  <span className="font-bold text-stone-700 font-mono">VNĐ = 1 điểm</span>
                </div>
              </div>

              {/* Quick presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-stone-400">Chọn nhanh:</span>
                {[5000, 10000, 15000, 20000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSpendToPointRatio(val)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      spendToPointRatio === val
                        ? 'bg-amber-600 text-white'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {formatCurrency(val)}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-stone-500">
                Mỗi khi khách mua đạt mốc tiền này sẽ được tặng 1 điểm thưởng vào thẻ VIP.
              </p>
            </div>

            {/* 2. Số tiền giảm của 1 điểm khi tiêu */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
              <div>
                <label className="font-bold text-stone-900 block mb-1">
                  2. Số tiền giảm của 1 điểm khi đổi:
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-700 font-mono">1 điểm =</span>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={pointToVndRatio}
                    onChange={(e) => setPointToVndRatio(Math.max(100, Number(e.target.value)))}
                    className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono font-bold text-amber-800 text-sm focus:outline-none focus:border-amber-600"
                    required
                  />
                  <span className="font-bold text-amber-800 font-mono">VNĐ giảm trừ</span>
                </div>
              </div>

              {/* Quick presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-stone-400">Chọn nhanh:</span>
                {[500, 1000, 1500, 2000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPointToVndRatio(val)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      pointToVndRatio === val
                        ? 'bg-amber-600 text-white'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {formatCurrency(val)}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-stone-500">
                Khi thanh toán hoặc lên đơn, khách có thể trừ điểm để giảm trực tiếp số tiền này.
              </p>
            </div>
          </div>

          {/* Mô phỏng trực quan công thức (Live Simulation Calculator) */}
          <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl space-y-1.5 text-xs text-stone-800">
            <div className="font-bold text-amber-900 flex items-center justify-between">
              <span>💡 Minh Họa Tỷ Lệ Đổi Điểm Thực Tế:</span>
              <span className="font-mono text-[11px] bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-full font-bold">
                Tỷ lệ hoàn tiền: {((1 / (spendToPointRatio || 10000)) * (pointToVndRatio || 1000) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-700">
              <div>
                • Khách mua đơn <strong>100.000đ</strong> ➔ Tích lũy được{' '}
                <strong className="text-amber-800 font-mono">+{Math.floor(100000 / (spendToPointRatio || 10000))} điểm</strong>.
              </div>
              <div>
                • Khi khách đổi <strong>10 điểm</strong> ➔ Được trừ thẳng{' '}
                <strong className="text-emerald-800 font-mono">-{formatCurrency(10 * (pointToVndRatio || 1000))}</strong> vào đơn.
              </div>
            </div>
          </div>

          {/* Phân hạng hội viên */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-[10px] text-stone-400 block uppercase font-bold">Thành Viên Mới</span>
              <strong className="text-sm font-mono text-stone-900 block mt-0.5">Tích x1.0</strong>
              <span className="text-[10px] text-stone-500">Chi tiêu dưới 300k</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-600 block uppercase font-bold">Hội Viên Bạc</span>
              <strong className="text-sm font-mono text-slate-800 block mt-0.5">Tích x1.15</strong>
              <span className="text-[10px] text-slate-500">Chi tiêu từ 300k</span>
            </div>

            <div className="p-3 bg-yellow-50 rounded-2xl border border-yellow-200">
              <span className="text-[10px] text-yellow-800 block uppercase font-bold">Hội Viên Vàng</span>
              <strong className="text-sm font-mono text-yellow-900 block mt-0.5">Tích x1.3</strong>
              <span className="text-[10px] text-yellow-700">Chi tiêu từ 1.200k</span>
            </div>

            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200">
              <span className="text-[10px] text-purple-800 block uppercase font-bold">VIP Kim Cương</span>
              <strong className="text-sm font-mono text-purple-900 block mt-0.5">Tích x1.5</strong>
              <span className="text-[10px] text-purple-700">Chi tiêu từ 3.000k</span>
            </div>
          </div>
        </div>

        {/* Nút lưu cấu hình */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-stone-900/20 active:scale-95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Thay Đổi Cấu Hình</span>
          </button>
        </div>
      </form>
    </div>
  );
};
