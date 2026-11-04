import { useState } from 'react';
import type { Order } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { useShopStore } from '../../stores/useShopStore';

interface PrintBillModalProps {
  order: Order;
  onClose: () => void;
}

export function PrintBillModal({ order, onClose }: PrintBillModalProps) {
  const [activeTab, setActiveTab] = useState<'bill' | 'stickers'>('bill');
  const shopConfig = useShopStore((state) => state.shopConfig);

  // Tách từng sản phẩm thành các tem nhãn riêng biệt (1 món số lượng N -> N tem)
  const stickerItems: Array<{
    itemIndex: number;
    totalStickers: number;
    productName: string;
    size?: string;
    options: string[];
    note?: string;
    orderCode: string;
    customerName: string;
    createdAt: string;
  }> = [];

  const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  let currentStickerIndex = 1;

  order.items.forEach((item) => {
    const optionLabels = item.optionsSummary ? [item.optionsSummary] : [];

    for (let i = 0; i < item.quantity; i++) {
      stickerItems.push({
        itemIndex: currentStickerIndex,
        totalStickers: totalItemsCount,
        productName: item.productName,
        options: optionLabels,
        note: item.itemNote,
        orderCode: order.orderCode,
        customerName: order.customerName,
        createdAt: order.createdAt,
      });
      currentStickerIndex++;
    }
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Styles for direct thermal printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-thermal-area, #printable-thermal-area * {
            visibility: visible;
          }
          #printable-thermal-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break-after {
            page-break-after: always;
            break-after: page;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              🖨️
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">In Hóa Đơn & Tem Dán Món</h3>
              <p className="text-xs text-slate-500">
                Đơn hàng <span className="font-semibold text-slate-700">{order.orderCode}</span> • {order.customerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 flex gap-2 bg-white no-print">
          <button
            onClick={() => setActiveTab('bill')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'bill'
                ? 'bg-amber-500 text-white shadow-sm font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🧾 Hóa Đơn Thanh Toán (K80 / K58)
          </button>
          <button
            onClick={() => setActiveTab('stickers')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'stickers'
                ? 'bg-amber-500 text-white shadow-sm font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🏷️ Tem Dán Ly & Bánh ({stickerItems.length} tem)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100 flex justify-center">
          <div id="printable-thermal-area" className="w-full flex justify-center">
            {activeTab === 'bill' ? (
              /* --- HÓA ĐƠN K80 --- */
              <div className="w-full max-w-[340px] bg-white p-4 sm:p-6 shadow-sm border border-slate-200 text-slate-800 font-mono text-xs rounded-lg print:border-none print:shadow-none print:w-full print:p-2">
                {/* Shop Header */}
                <div className="text-center pb-4 border-b border-dashed border-slate-300">
                  <h2 className="text-base font-black tracking-wider uppercase text-slate-900">{shopConfig.shopName}</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">{shopConfig.tagline}</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">{shopConfig.address}</p>
                  <p className="text-[10px] text-slate-500">Hotline: {shopConfig.hotline}</p>
                  <div className="mt-2 text-center inline-block px-2.5 py-0.5 bg-slate-100 rounded text-[11px] font-bold">
                    HÓA ĐƠN BÁN HÀNG
                  </div>
                </div>

                {/* Meta info */}
                <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã đơn:</span>
                    <span className="font-bold">{order.orderCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Thời gian:</span>
                    <span>{formatDateTime(order.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Khách hàng:</span>
                    <span className="font-semibold">{order.customerName} ({order.customerPhone})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hình thức:</span>
                    <span className="font-bold">
                      {order.fulfillmentType === 'delivery' ? '🚚 Giao hàng tận nơi' : '🏪 Nhận tại quán'}
                    </span>
                  </div>
                  {order.fulfillmentType === 'delivery' && (
                    <div className="mt-1 pt-1 border-t border-slate-100 text-[10px]">
                      <div className="text-slate-500">Địa chỉ giao:</div>
                      <div className="font-medium text-slate-700">{order.deliveryAddress || 'Chưa cung cấp'}</div>
                      {order.deliveryScheduledTime && (
                        <div className="text-amber-600 font-semibold mt-0.5">
                          Hẹn giao: {formatDateTime(order.deliveryScheduledTime)}
                        </div>
                      )}
                    </div>
                  )}
                  {order.note && (
                    <div className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded mt-1">
                      <span className="font-bold">Ghi chú:</span> {order.note}
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div className="py-3 border-b border-dashed border-slate-300">
                  <div className="grid grid-cols-12 font-bold text-[11px] pb-1 border-b border-slate-200">
                    <div className="col-span-6">Món</div>
                    <div className="col-span-2 text-center">SL</div>
                    <div className="col-span-4 text-right">T.Tiền</div>
                  </div>

                  <div className="divide-y divide-slate-100 mt-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-1.5 text-[11px]">
                        <div className="grid grid-cols-12">
                          <div className="col-span-6 font-semibold">{item.productName}</div>
                          <div className="col-span-2 text-center font-bold">x{item.quantity}</div>
                          <div className="col-span-4 text-right font-semibold">{formatCurrency(item.totalPrice)}</div>
                        </div>

                        {/* Options / Topping / Notes */}
                        {item.optionsSummary && (
                          <div className="text-[10px] text-slate-500 pl-2">
                            {item.optionsSummary}
                          </div>
                        )}
                        {item.itemNote && (
                          <div className="text-[10px] italic text-slate-400 pl-2">
                            Note: {item.itemNote}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotals & Discounts */}
                <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tạm tính:</span>
                    <span>{formatCurrency(order.subTotal)}</span>
                  </div>

                  {order.voucherDiscount ? (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Voucher ({order.voucherCode}):</span>
                      <span>-{formatCurrency(order.voucherDiscount)}</span>
                    </div>
                  ) : null}

                  {order.discountAmount ? (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Đổi điểm ({order.discountPointsUsed} điểm):</span>
                      <span>-{formatCurrency(order.discountAmount)}</span>
                    </div>
                  ) : null}

                  {order.fulfillmentType === 'delivery' && (
                    <div className="flex justify-between text-slate-700">
                      <span>Phí giao hàng:</span>
                      <span>{order.shippingFee ? formatCurrency(order.shippingFee) : '0đ (Freeship)'}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                    <span>TỔNG CỘNG:</span>
                    <span className="text-base text-amber-600">{formatCurrency(order.orderTotal)}</span>
                  </div>
                </div>

                {/* Payment & Points */}
                <div className="py-3 border-b border-dashed border-slate-300 text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hình thức thanh toán:</span>
                    <span className="font-semibold uppercase">
                      {order.paymentMethod === 'vietqr' ? 'Chuyển khoản VietQR' : 'Tiền mặt'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trạng thái thanh toán:</span>
                    <span className={`font-bold ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {order.paymentStatus === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                    </span>
                  </div>
                  {order.earnedPoints ? (
                    <div className="flex justify-between text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                      <span>Điểm tích lũy nhận được:</span>
                      <span>+{order.earnedPoints} điểm</span>
                    </div>
                  ) : null}
                </div>

                {/* Footer */}
                <div className="pt-4 text-center text-[10px] text-slate-500 space-y-1">
                  <p className="font-medium text-slate-700">Cảm ơn quý khách và hẹn gặp lại! ❤️</p>
                  <p>Wifi: <span className="font-bold">BakeAndSip_Guest</span> (Pass: 88888888)</p>
                  <p className="text-[9px] text-slate-400 mt-2">Bake & Sip POS • {new Date().toLocaleTimeString('vi-VN')}</p>
                </div>
              </div>
            ) : (
              /* --- TEM DÁN TỪNG LY / HỘP BÁNH --- */
              <div className="w-full max-w-md space-y-4">
                <div className="bg-amber-50 text-amber-800 p-3 rounded-xl text-xs flex items-center justify-between no-print">
                  <span>
                    💡 Sẽ in <strong>{stickerItems.length} tem</strong> riêng biệt cho từng ly và hộp bánh của đơn hàng.
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {stickerItems.map((sticker, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-800 font-mono shadow-sm page-break-after print:border-black print:shadow-none print:m-2"
                      style={{ minHeight: '120px' }}
                    >
                      {/* Top line */}
                      <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-1.5 text-[11px]">
                        <span className="font-black uppercase tracking-wider text-slate-900">{shopConfig.shopName}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">
                            {sticker.orderCode}
                          </span>
                          <span className="font-bold text-amber-600 text-xs">
                            {sticker.itemIndex}/{sticker.totalStickers}
                          </span>
                        </div>
                      </div>

                      {/* Product Name */}
                      <div className="pt-2">
                        <div className="text-sm font-black text-slate-900 uppercase leading-snug">
                          {sticker.productName}
                        </div>
                      </div>

                      {/* Options / Size / Topping */}
                      <div className="text-[11px] text-slate-700 space-y-0.5 mt-1">
                        {sticker.options.length > 0 && (
                          <div className="font-medium">{sticker.options.join(' • ')}</div>
                        )}
                        {sticker.note && (
                          <div className="text-[10px] text-amber-800 font-bold bg-amber-50/80 px-1.5 py-0.5 rounded inline-block mt-0.5">
                            👉 Note: {sticker.note}
                          </div>
                        )}
                      </div>

                      {/* Footer sticker */}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-1.5 mt-2">
                        <span className="font-medium text-slate-600 truncate max-w-[160px]">{sticker.customerName}</span>
                        <span>{new Date(sticker.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between no-print">
          <p className="text-xs text-slate-500">
            {activeTab === 'bill' ? 'Khổ in chuẩn máy in nhiệt 80mm/58mm' : `In ${stickerItems.length} tem dán nhãn`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
            >
              🖨️ In Ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
