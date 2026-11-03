import React, { useState } from 'react';
import { Sparkles, RotateCcw, ArrowRightLeft, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { isDemoMode, switchAppMode, storeService } from '../../services/storeService';

export const DemoBanner: React.FC = () => {
  const isDemo = isDemoMode();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục lại toàn bộ dữ liệu mẫu (sản phẩm, ca trực, đơn hàng) về trạng thái ban đầu?')) {
      setIsResetting(true);
      storeService.resetDemoData();
    }
  };

  const handleToggleMode = () => {
    const targetMode = isDemo ? 'live' : 'demo';
    const msg = isDemo
      ? 'Chuyển sang chế độ Vận Hành Chính Thức (kết nối trực tiếp Go API & MongoDB)?'
      : 'Chuyển sang chế độ Dùng Thử (chạy dữ liệu Mock trên trình duyệt)?';

    if (window.confirm(msg)) {
      switchAppMode(targetMode);
    }
  };

  return (
    <aside
      aria-label="Cấu hình chế độ trải nghiệm"
      className="fixed bottom-4 left-4 z-50 transition-all duration-300 font-sans select-none print:hidden"
    >
      <div
        className={`flex items-center gap-2 p-1.5 rounded-full shadow-lg border backdrop-blur-md transition-all ${
          isDemo
            ? 'bg-amber-500/90 text-amber-950 border-amber-300/80 shadow-amber-900/20'
            : 'bg-emerald-600/90 text-white border-emerald-400/60 shadow-emerald-950/20'
        }`}
      >
        {/* Badge trạng thái */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide hover:opacity-85 transition-opacity cursor-pointer"
        >
          {isDemo ? (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-900" />
              <span>BẢN DEMO MẪU</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
              <span>LIVE DATABASE</span>
            </>
          )}
          {isCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Các nút hành động khi mở rộng */}
        {!isCollapsed && (
          <div className="flex items-center gap-1 pr-1 text-xs">
            {isDemo && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isResetting}
                title="Khôi phục lại toàn bộ sản phẩm và ca trực về mẫu ban đầu"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-900/15 hover:bg-amber-900/25 text-amber-950 font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Reset Mẫu</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleMode}
              title={isDemo ? 'Chuyển sang kết nối Backend thật' : 'Chuyển sang bản Mock Demo'}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/15 hover:bg-black/25 font-medium transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>{isDemo ? 'Nối Backend' : 'Dùng Demo'}</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
