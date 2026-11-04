import React, { createContext, useContext, useEffect, useState } from 'react';
import { SHOP_CONFIG } from '../constants/shopConstants';
import type { Product, SelectedOptionChoice } from '../types';
import { formatCurrency } from '../utils/format';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedOptions: SelectedOptionChoice[];
  itemNote?: string; // Ghi chú riêng cho món này
  optionsSummaryText: string;
  unitPrice: number;
}

export interface AddItemPayload {
  product: Product;
  quantity: number;
  selectedOptions: SelectedOptionChoice[];
  itemNote?: string;
}

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItemToCart: (payload: AddItemPayload) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateItemNote: (cartItemId: string, itemNote: string) => void;
  getItemQuantity: (productId: string) => number;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
  estimatedPoints: number;
  lastAddedName: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'bake_sip_cart_items_v3';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAddedName, setLastAddedName] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [items]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Generate a distinct ID for a customized item in cart
  const generateCartItemId = (
    productId: string,
    selectedOptions: SelectedOptionChoice[],
    itemNote?: string
  ): string => {
    const optionsKey = selectedOptions
      .map((g) => `${g.groupId}:${g.selectedItems.map((opt) => opt.id).sort().join(',')}`)
      .sort()
      .join('|');
    const noteKey = itemNote ? itemNote.trim().toLowerCase() : '';
    return `${productId}_[${optionsKey}]_${noteKey}`;
  };

  // Build a concise, human-friendly summary text
  const buildOptionsSummary = (selectedOptions: SelectedOptionChoice[]): string => {
    const parts: string[] = [];
    selectedOptions.forEach((group) => {
      group.selectedItems.forEach((opt) => {
        if (opt.price > 0) {
          parts.push(`${opt.name} (+${formatCurrency(opt.price)})`);
        } else {
          parts.push(opt.name);
        }
      });
    });
    return parts.join(' &bull; ');
  };

  const addItemToCart = ({ product, quantity, selectedOptions, itemNote }: AddItemPayload) => {
    const cartItemId = generateCartItemId(product.id, selectedOptions, itemNote);

    // Calculate unit price: product base price + all option prices
    let unitPrice = product.price;
    selectedOptions.forEach((group) => {
      group.selectedItems.forEach((opt) => {
        unitPrice += opt.price;
      });
    });

    const optionsSummaryText = buildOptionsSummary(selectedOptions);

    setItems((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          product,
          quantity,
          selectedOptions,
          itemNote: itemNote?.trim() || undefined,
          optionsSummaryText,
          unitPrice,
        },
      ];
    });

    setLastAddedName(product.name);
    setTimeout(() => setLastAddedName(null), 1500);
  };

  const getItemQuantity = (productId: string): number => {
    return items
      .filter((item) => item.product.id === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  const updateItemNote = (cartItemId: string, itemNote: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId ? { ...item, itemNote: itemNote.trim() || undefined } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const estimatedPoints = Math.floor(totalAmount / SHOP_CONFIG.spendToPointRatio);

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        openCart,
        closeCart,
        addItemToCart,
        removeFromCart,
        updateQuantity,
        updateItemNote,
        getItemQuantity,
        clearCart,
        totalAmount,
        totalItems,
        estimatedPoints,
        lastAddedName,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
