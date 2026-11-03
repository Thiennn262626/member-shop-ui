import React, { useState } from 'react';
import {
  Store,
  QrCode,
  Award,
  Save,
  CheckCircle2,
  Phone,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import { mockDb } from '../../services/mockDb';

export const ShopSettings: React.FC = () => {
  const currentConfig = mockDb.getShopConfig();
  const [shopName, setShopName] = useState(currentConfig.shopName);
  const [tagline, setTagline] = useState(currentConfig.tagline);
  const [hotline, setHotline] = useState(currentConfig.hotline);
  const [zaloPhone, setZaloPhone] = useState(currentConfig.zaloPhone);
  const [address, setAddress] = useState(currentConfig.address);

  // Bank Info
  const [bankName, setBankName] = useState(currentConfig.bank.bankName);
  const [accountNumber, setAccountNumber] = useState(currentConfig.bank.accountNumber);
  const [accountHolder, setAccountHolder] = useState(currentConfig.bank.accountHolder);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mockDb.updateShopConfig({
      shopName,
      tagline,
      hotline,
      zaloPhone,
      address,
      bank: {
        bankName,
        accountNumber,
        accountHolder,
      },
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="flex-1 p-3 sm:p-6 max-w-5xl mx-auto w-full space-y-6 font-sans">
      {/* Toast Notification */}
      {savedSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-amber-300 px-4 py-3 rounded-2xl shadow-xl border border-stone-700 flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Đã lưu cấu hình cửa hàng thành công!</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
        <h2 className="font-serif font-extrabold text-stone-900 text-lg sm:text-xl flex items-center gap-2">
          <Store className="w-5 h-5 text-amber-600" />
          <span>Cài Đặt Cửa Hàng & Thanh Toán VietQR</span>
        </h2>
        <span className="text-xs text-stone-500">
          Tùy chỉnh thông tin liên hệ, ngân hàng nhận tiền chuyển khoản và chính sách tích điểm
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

        {/* Card 2: Tài khoản nhận tiền VietQR */}
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

        {/* Card 3: Chính sách tích điểm thành viên */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2 border-b border-stone-100 pb-3">
            <Award className="w-4 h-4 text-purple-600" />
            <span>Chính Sách Tích Điểm & Phân Hạng Hội Viên</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-[10px] text-stone-400 block uppercase font-bold">Tỷ Lệ Tích Điểm</span>
              <strong className="text-sm font-mono text-stone-900 block mt-0.5">10.000đ = 1 điểm</strong>
              <span className="text-[10px] text-stone-500">Chi tiêu 10k nhận 1 điểm</span>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-[10px] text-stone-400 block uppercase font-bold">Tỷ Lệ Đổi Tiền</span>
              <strong className="text-sm font-mono text-amber-800 block mt-0.5">1 điểm = 1.000đ</strong>
              <span className="text-[10px] text-stone-500">Trừ trực tiếp vào hóa đơn</span>
            </div>

            <div className="p-3 bg-yellow-50 rounded-2xl border border-yellow-200">
              <span className="text-[10px] text-yellow-800 block uppercase font-bold">Hội Viên Vàng</span>
              <strong className="text-sm font-mono text-yellow-900 block mt-0.5">Tích x1.3 lần</strong>
              <span className="text-[10px] text-yellow-700">Chi tiêu từ 1.200.000đ</span>
            </div>

            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200">
              <span className="text-[10px] text-purple-800 block uppercase font-bold">VIP Kim Cương</span>
              <strong className="text-sm font-mono text-purple-900 block mt-0.5">Tích x1.5 lần</strong>
              <span className="text-[10px] text-purple-700">Chi tiêu từ 3.000.000đ</span>
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
