import React, { useState } from 'react';
import { X, Sparkles, Gift, Check, Copy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REWARDS = [
  { id: 1, label: '+10 Điểm Hội Viên', code: 'BONUS10P', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  { id: 2, label: 'Voucher Giảm 15k', code: 'BANH15K', color: 'bg-rose-100 text-rose-900 border-rose-300' },
  { id: 3, label: 'Tặng 1 Ly Trà Đào', code: 'FREETRADAO', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { id: 4, label: '+20 Điểm Thưởng', code: 'BONUS20P', color: 'bg-purple-100 text-purple-900 border-purple-300' },
  { id: 5, label: 'Freeship Đơn Zalo', code: 'FREESHIP', color: 'bg-sky-100 text-sky-900 border-sky-300' },
  { id: 6, label: 'Giảm 10% Đơn Bánh', code: 'DISCOUNT10', color: 'bg-yellow-100 text-yellow-900 border-yellow-300' },
];

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({ isOpen, onClose }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedReward, setSelectedReward] = useState<typeof REWARDS[0] | null>(null);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (isSpinning || hasPlayed) return;

    setIsSpinning(true);
    setSelectedReward(null);

    // Random reward index
    const randomIndex = Math.floor(Math.random() * REWARDS.length);
    const extraSpins = 5 * 360; // 5 full rounds
    const sliceAngle = 360 / REWARDS.length;
    const targetDegree = extraSpins + (360 - randomIndex * sliceAngle - sliceAngle / 2);

    setRotationDegree(targetDegree);

    setTimeout(() => {
      setIsSpinning(false);
      setSelectedReward(REWARDS[randomIndex]);
      setHasPlayed(true);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 4000);
  };

  const handleCopyCode = () => {
    if (!selectedReward) return;
    navigator.clipboard.writeText(selectedReward.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity" />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden text-center p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-left">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Vòng Quay Săn Thưởng
                </h3>
                <span className="text-[11px] text-stone-500">Mỗi ngày 1 lượt quay miễn phí</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Interactive Wheel Graphic */}
          <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
            {/* Wheel Indicator Pointer */}
            <div className="absolute -top-2 z-20 w-0 h-0 border-x-8 border-x-transparent border-t-16 border-t-rose-600 filter drop-shadow-md" />

            {/* Rotating Disk */}
            <div
              className="w-full h-full rounded-full border-4 border-stone-900 relative overflow-hidden transition-transform ease-out shadow-lg"
              style={{
                transform: `rotate(${rotationDegree}deg)`,
                transitionDuration: isSpinning ? '4000ms' : '0ms',
                background: 'conic-gradient(#fef08a 0deg 60deg, #fed7aa 60deg 120deg, #fbcfe8 120deg 180deg, #bae6fd 180deg 240deg, #bbf7d0 240deg 300deg, #fef3c7 300deg 360deg)',
              }}
            >
              {REWARDS.map((r, index) => {
                const angle = (360 / REWARDS.length) * index + 360 / REWARDS.length / 2;
                return (
                  <div
                    key={r.id}
                    className="absolute inset-0 flex items-start justify-center pt-3 text-[10px] font-bold text-stone-900 uppercase"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: '50% 50%',
                    }}
                  >
                    <span className="w-20 text-center leading-tight line-clamp-2 px-1">
                      {r.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Center Spin Button */}
            <button
              disabled={isSpinning || hasPlayed}
              onClick={handleSpin}
              className={`absolute z-10 w-16 h-16 rounded-full font-bold text-xs uppercase shadow-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                hasPlayed
                  ? 'bg-stone-300 text-stone-600 cursor-not-allowed'
                  : isSpinning
                  ? 'bg-amber-400 text-stone-950 animate-pulse'
                  : 'bg-stone-900 hover:bg-stone-800 text-amber-300 active:scale-95'
              }`}
            >
              <Sparkles className="w-4 h-4 mb-0.5" />
              <span>{isSpinning ? 'Quay...' : hasPlayed ? 'Đã Quay' : 'Quay'}</span>
            </button>
          </div>

          {/* Reward Announcement */}
          {selectedReward && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-4 space-y-2 animate-fade-in">
              <div className="text-xs text-amber-900 font-semibold uppercase tracking-wider">
                Chúc mừng bạn đã trúng thưởng! 🎉
              </div>
              <div className="text-lg font-bold text-stone-900 font-serif">
                {selectedReward.label}
              </div>
              <p className="text-xs text-stone-600">
                Nhập hoặc gửi mã này qua Zalo để tiệm cộng điểm hoặc áp dụng ưu đãi vào đơn hàng của bạn nhé!
              </p>

              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="px-3 py-1.5 bg-white border border-stone-300 rounded-xl font-mono text-sm font-bold text-stone-900 tracking-wider">
                  {selectedReward.code}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>
          )}

          {!selectedReward && !hasPlayed && (
            <p className="text-xs text-stone-500">
              Nhấn nút <strong>QUAY</strong> ở tâm vòng xoay để nhận quà bất ngờ hôm nay!
            </p>
          )}

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Đóng lại & Tiếp tục xem bánh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
