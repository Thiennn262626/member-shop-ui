import { create } from 'zustand';
import { apiStoreService } from '../services/api/apiStoreService';
import { SHOP_CONFIG } from '../constants/shopConstants';
import type { ShopConfig, Product, Voucher } from '../types';

const STORAGE_KEY_CONFIG = 'bake_sip_cached_shop_config_v1';
const STORAGE_KEY_PRODUCTS = 'bake_sip_cached_products_v1';
const STORAGE_KEY_VOUCHERS = 'bake_sip_cached_vouchers_v1';

// Đọc dữ liệu từ sessionStorage (cache theo phiên, tránh gọi lại API khi chuyển tab hoặc refresh)
function loadCachedData<T>(key: string, fallback: T): { data: T; isLoaded: boolean } {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { data: parsed as T, isLoaded: true };
      }
    }
  } catch {
    // Ignore storage parse error
  }
  return { data: fallback, isLoaded: false };
}

function saveCachedData<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota error
  }
}

interface ShopState {
  // --- CẤU HÌNH CỬA HÀNG ---
  shopConfig: ShopConfig;
  isConfigLoaded: boolean;
  isConfigLoading: boolean;
  fetchShopConfig: (force?: boolean) => Promise<ShopConfig>;
  updateShopConfig: (updates: Partial<ShopConfig>) => Promise<ShopConfig>;
  setShopConfig: (config: ShopConfig) => void;

  // --- SẢN PHẨM ---
  products: Product[];
  isProductsLoaded: boolean;
  isProductsLoading: boolean;
  fetchProducts: (force?: boolean) => Promise<Product[]>;
  setProducts: (products: Product[]) => void;

  // --- MÃ GIẢM GIÁ / VOUCHERS ---
  vouchers: Voucher[];
  isVouchersLoaded: boolean;
  isVouchersLoading: boolean;
  fetchVouchers: (force?: boolean) => Promise<Voucher[]>;
  setVouchers: (vouchers: Voucher[]) => void;
}

// Khởi tạo state từ cache
const initialConfig = loadCachedData<ShopConfig>(STORAGE_KEY_CONFIG, SHOP_CONFIG);
const initialProducts = loadCachedData<Product[]>(STORAGE_KEY_PRODUCTS, []);
const initialVouchers = loadCachedData<Voucher[]>(STORAGE_KEY_VOUCHERS, []);

// Biến lưu trữ Promise đang bay (In-flight request deduplication) và cờ nạp dữ liệu một lần (Memory Singleton)
let configInFlightPromise: Promise<ShopConfig> | null = null;
let productsInFlightPromise: Promise<Product[]> | null = null;
let vouchersInFlightPromise: Promise<Voucher[]> | null = null;

// Cờ xác nhận đã nạp thành công từ backend ít nhất 1 lần trong phiên hiện tại
let configFetchedOnce = initialConfig.isLoaded;
let productsFetchedOnce = initialProducts.isLoaded && initialProducts.data.length > 0;
let vouchersFetchedOnce = initialVouchers.isLoaded;

export const useShopStore = create<ShopState>((set, get) => ({
  // 1. CONFIG STATE
  shopConfig: initialConfig.data,
  isConfigLoaded: initialConfig.isLoaded,
  isConfigLoading: false,

  fetchShopConfig: async (force = false): Promise<ShopConfig> => {
    const { isConfigLoaded, shopConfig } = get();

    // Nếu đã nạp cấu hình và không ép buộc fetch lại -> Trả về ngay lập tức, tuyệt đối không gửi request mạng!
    if (!force && (configFetchedOnce || isConfigLoaded) && shopConfig?.shopName) {
      return shopConfig;
    }

    // Nếu đang có 1 request fetchShopConfig đang chạy dở -> Tái sử dụng request đó, không gửi duplicate request
    if (configInFlightPromise) {
      return configInFlightPromise;
    }

    set({ isConfigLoading: true });

    configInFlightPromise = (async () => {
      try {
        const config = await apiStoreService.getShopConfig();
        if (config) {
          configFetchedOnce = true;
          saveCachedData(STORAGE_KEY_CONFIG, config);
          set({ shopConfig: config, isConfigLoaded: true, isConfigLoading: false });
          return config;
        }
        return get().shopConfig;
      } catch (error) {
        set({ isConfigLoading: false });
        console.warn('⚠️ [useShopStore] Không thể tải shop config từ API, sử dụng cấu hình hiện tại:', error);
        return get().shopConfig;
      } finally {
        configInFlightPromise = null;
      }
    })();

    return configInFlightPromise;
  },

  updateShopConfig: async (updates: Partial<ShopConfig>): Promise<ShopConfig> => {
    try {
      const updated = await apiStoreService.updateShopConfig(updates);
      if (updated) {
        saveCachedData(STORAGE_KEY_CONFIG, updated);
        set({ shopConfig: updated, isConfigLoaded: true });

        // Đồng bộ sự kiện cho các thành phần legacy nếu có
        window.dispatchEvent(new CustomEvent('bake_sip_config_updated', { detail: updated }));
        return updated;
      }
      return get().shopConfig;
    } catch (error) {
      console.error('❌ [useShopStore] Lỗi cập nhật shop config:', error);
      throw error;
    }
  },

  setShopConfig: (config: ShopConfig) => {
    saveCachedData(STORAGE_KEY_CONFIG, config);
    set({ shopConfig: config, isConfigLoaded: true });
  },

  // 2. PRODUCTS STATE
  products: initialProducts.data,
  isProductsLoaded: initialProducts.isLoaded && initialProducts.data.length > 0,
  isProductsLoading: false,

  fetchProducts: async (force = false): Promise<Product[]> => {
    const { isProductsLoaded, products } = get();

    if (!force && (productsFetchedOnce || isProductsLoaded) && products?.length > 0) {
      return products;
    }

    if (productsInFlightPromise) {
      return productsInFlightPromise;
    }

    set({ isProductsLoading: true });

    productsInFlightPromise = (async () => {
      try {
        const list = await apiStoreService.getProducts();
        if (list) {
          productsFetchedOnce = true;
          saveCachedData(STORAGE_KEY_PRODUCTS, list);
          set({ products: list, isProductsLoaded: true, isProductsLoading: false });
          return list;
        }
        return get().products;
      } catch (error) {
        set({ isProductsLoading: false });
        console.warn('⚠️ [useShopStore] Không thể tải danh sách sản phẩm từ API:', error);
        return get().products;
      } finally {
        productsInFlightPromise = null;
      }
    })();

    return productsInFlightPromise;
  },

  setProducts: (products: Product[]) => {
    saveCachedData(STORAGE_KEY_PRODUCTS, products);
    set({ products, isProductsLoaded: true });
  },

  // 3. VOUCHERS STATE
  vouchers: initialVouchers.data,
  isVouchersLoaded: initialVouchers.isLoaded,
  isVouchersLoading: false,

  fetchVouchers: async (force = false): Promise<Voucher[]> => {
    const { isVouchersLoaded, vouchers } = get();

    if (!force && (vouchersFetchedOnce || isVouchersLoaded) && vouchers?.length > 0) {
      return vouchers;
    }

    if (vouchersInFlightPromise) {
      return vouchersInFlightPromise;
    }

    set({ isVouchersLoading: true });

    vouchersInFlightPromise = (async () => {
      try {
        const list = await apiStoreService.getVouchers();
        if (list) {
          vouchersFetchedOnce = true;
          saveCachedData(STORAGE_KEY_VOUCHERS, list);
          set({ vouchers: list, isVouchersLoaded: true, isVouchersLoading: false });
          return list;
        }
        return get().vouchers;
      } catch (error) {
        set({ isVouchersLoading: false });
        console.warn('⚠️ [useShopStore] Không thể tải danh sách voucher:', error);
        return get().vouchers;
      } finally {
        vouchersInFlightPromise = null;
      }
    })();

    return vouchersInFlightPromise;
  },

  setVouchers: (vouchers: Voucher[]) => {
    saveCachedData(STORAGE_KEY_VOUCHERS, vouchers);
    set({ vouchers, isVouchersLoaded: true });
  },
}));

// Lắng nghe sự kiện đồng bộ giữa các tabs trình duyệt (Storage Event)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY_CONFIG && e.newValue) {
      try {
        const updated = JSON.parse(e.newValue);
        useShopStore.getState().setShopConfig(updated);
      } catch {
        // Ignore
      }
    }
  });

  window.addEventListener('bake_sip_config_updated', (e) => {
    const custom = e as CustomEvent<ShopConfig>;
    if (custom.detail) {
      useShopStore.getState().setShopConfig(custom.detail);
    }
  });
}
