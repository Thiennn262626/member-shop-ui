import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';
import type { ItemOptionItem, Product, SelectedOptionChoice } from '../../types';
import { formatCurrency } from '../../utils/format';

interface ItemCustomizationModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    product: Product;
    quantity: number;
    selectedOptions: SelectedOptionChoice[];
    itemNote?: string;
  }) => void;
}

export const ItemCustomizationModal: React.FC<ItemCustomizationModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedMap, setSelectedMap] = useState<Record<string, ItemOptionItem[]>>({});
  const [itemNote, setItemNote] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize defaults whenever a new product is opened
  useEffect(() => {
    if (product && product.optionGroups) {
      const initialMap: Record<string, ItemOptionItem[]> = {};

      product.optionGroups.forEach((group) => {
        const availableOptions = group.options.filter((o) => o.isAvailable !== false);
        if (group.selection === 'only') {
          // Find default option or pick the first available if required
          const defaultOpt =
            availableOptions.find((o) => o.isDefault) ||
            (group.required && availableOptions.length > 0 ? availableOptions[0] : null);
          initialMap[group.id] = defaultOpt ? [defaultOpt] : [];
        } else {
          // Multiple selection: start with preselected available options
          const defaultOpts = availableOptions.filter((o) => o.isDefault);
          initialMap[group.id] = defaultOpts;
        }
      });

      setSelectedMap(initialMap);
      setItemNote('');
      setQuantity(1);
      setErrorMsg(null);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  // Handle clicking an option
  const handleSelectOption = (groupId: string, option: ItemOptionItem, isOnly: boolean) => {
    if (option.isAvailable === false) return;
    setErrorMsg(null);
    setSelectedMap((prev) => {
      const currentList = prev[groupId] || [];

      if (isOnly) {
        // 'only' selection: replace with the clicked option
        return { ...prev, [groupId]: [option] };
      } else {
        // 'many' selection: toggle
        const exists = currentList.some((o) => o.id === option.id);
        const updated = exists
          ? currentList.filter((o) => o.id !== option.id)
          : [...currentList, option];
        return { ...prev, [groupId]: updated };
      }
    });
  };

  // Calculate pricing
  let optionsExtraPrice = 0;
  Object.values(selectedMap).forEach((items) => {
    items.forEach((item) => {
      optionsExtraPrice += item.price;
    });
  });

  const unitPrice = product.price + optionsExtraPrice;
  const totalPrice = unitPrice * quantity;

  // Handle confirmation
  const handleConfirm = () => {
    // Validate required groups
    if (product.optionGroups) {
      for (const group of product.optionGroups) {
        const selections = selectedMap[group.id] || [];
        if (group.required && selections.length === 0) {
          setErrorMsg(`Vui lòng chọn mục "${group.name}" trước khi thêm vào giỏ.`);
          return;
        }
      }
    }

    // Convert map to SelectedOptionChoice array
    const selectedOptions: SelectedOptionChoice[] = (product.optionGroups || []).map((group) => ({
      groupId: group.id,
      groupName: group.name,
      selectedItems: selectedMap[group.id] || [],
    })).filter((g) => g.selectedItems.length > 0);

    onConfirm({
      product,
      quantity,
      selectedOptions,
      itemNote: itemNote.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity" />

      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base sm:text-lg">
                Tùy Chọn Món & Ghi Chú
              </h3>
              <span className="text-[11px] text-stone-500">
                Tùy chỉnh kích thước, topping và ghi chú riêng cho món này
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Scrollable */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
            {/* Product Summary */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl bg-stone-100 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md inline-block mb-1">
                  {product.category}
                </span>
                <h4 className="font-serif font-bold text-stone-900 text-base sm:text-lg truncate">
                  {product.name}
                </h4>
                <div className="text-xs font-bold text-amber-700 mt-0.5">
                  Giá gốc: {formatCurrency(product.price)}
                </div>
              </div>
            </div>

            {/* Error message banner */}
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Option Groups (Render dynamically) */}
            {product.optionGroups && product.optionGroups.length > 0 ? (
              product.optionGroups.map((group) => {
                const isOnly = group.selection === 'only';
                const currentSelections = selectedMap[group.id] || [];

                return (
                  <div key={group.id} className="space-y-2.5">
                    {/* Group Title and Requirement Badges */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-stone-900">
                          {group.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                        {group.required ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                            Bắt buộc
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                            Tùy chọn
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                          {isOnly ? 'Chọn 1' : 'Chọn nhiều'}
                        </span>
                      </div>
                    </div>

                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.options.map((opt) => {
                        const isOutOfStock = opt.isAvailable === false;
                        const isSelected = currentSelections.some((o) => o.id === opt.id);

                        return (
                          <button
                            type="button"
                            key={opt.id}
                            disabled={isOutOfStock}
                            onClick={() => handleSelectOption(group.id, opt, isOnly)}
                            className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                              isOutOfStock
                                ? 'border-stone-200 bg-stone-100/70 text-stone-400 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'border-amber-600 bg-amber-50/80 text-stone-950 font-bold shadow-xs cursor-pointer'
                                : 'border-stone-200 hover:border-stone-300 text-stone-700 font-medium cursor-pointer'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs sm:text-sm truncate ${isOutOfStock ? 'line-through text-stone-400' : ''}`}>
                                  {opt.name}
                                </span>
                                {isOutOfStock && (
                                  <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                    Tạm hết
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                                {opt.price > 0 ? `+${formatCurrency(opt.price)}` : 'Miễn phí'}
                              </div>
                            </div>

                            {/* Checkmark or Radio circle */}
                            <div
                              className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                                isOutOfStock
                                  ? 'border-stone-200 bg-stone-200 text-stone-400'
                                  : isSelected
                                  ? 'bg-amber-600 border-amber-600 text-white'
                                  : 'border-stone-300 bg-white'
                              }`}
                            >
                              {isSelected && !isOutOfStock && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-stone-500 italic">Món này không có nhóm tùy chọn thêm.</p>
            )}

            {/* ITEM-LEVEL NOTE INPUT (GHI CHÚ RIÊNG CHO MÓN NÀY) */}
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <label className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-amber-700" />
                <span>Ghi chú riêng cho món này (Tùy chọn)</span>
              </label>
              <textarea
                rows={2}
                placeholder="VD: Hâm bánh thật nóng giòn, không lấy hành ngò, để đá riêng mang đi xa, cắm nến sinh nhật giúp mình..."
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-all resize-none"
              />
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3 shrink-0">
            {/* Quantity Selector */}
            <div className="flex items-center border border-stone-300 rounded-2xl overflow-hidden bg-white shadow-xs">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2 sm:p-2.5 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-extrabold text-sm text-stone-900 font-mono">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="p-2 sm:p-2.5 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Confirm Add Button */}
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-3 px-4 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Thêm Vào Giỏ &bull; {formatCurrency(totalPrice)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
