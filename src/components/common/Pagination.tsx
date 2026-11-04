import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowRight,
} from 'lucide-react';
import type { PaginationMeta } from '../../services/api/httpClient';

export interface PaginationProps {
  meta?: PaginationMeta;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  itemLabel?: string; // Ví dụ: "khách hàng", "đơn hàng", "món", "nhân viên"
}

export const Pagination: React.FC<PaginationProps> = ({
  meta,
  currentPage: propCurrentPage,
  totalPages: propTotalPages,
  totalItems: propTotalItems,
  pageSize: propPageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = '',
  itemLabel = 'bản ghi',
}) => {
  // Đồng bộ giá trị từ meta nếu có
  const page = meta?.page ?? propCurrentPage ?? 1;
  const size = meta?.pageSize ?? propPageSize ?? 20;
  const total = meta?.total ?? propTotalItems ?? 0;
  const totalPages = Math.max(1, meta?.totalPages ?? propTotalPages ?? Math.ceil(total / size));

  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  // Nếu không có dữ liệu
  if (total === 0) {
    return null;
  }

  // Tính khoảng hiển thị
  const startItem = (page - 1) * size + 1;
  const endItem = Math.min(page * size, total);

  // Thuật toán sinh danh sách nút số trang thông minh (Smart Ellipsis)
  const getPageNumbers = (): (number | 'ellipsis-left' | 'ellipsis-right')[] => {
    const pages: (number | 'ellipsis-left' | 'ellipsis-right')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Luôn hiển thị trang đầu
    pages.push(1);

    const leftBound = Math.max(2, page - 1);
    const rightBound = Math.min(totalPages - 1, page + 1);

    if (leftBound > 2) {
      pages.push('ellipsis-left');
    }

    for (let i = leftBound; i <= rightBound; i++) {
      pages.push(i);
    }

    if (rightBound < totalPages - 1) {
      pages.push('ellipsis-right');
    }

    // Luôn hiển thị trang cuối
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpPageInput, 10);
    if (!isNaN(target)) {
      const clamped = Math.max(1, Math.min(totalPages, target));
      onPageChange(clamped);
      setJumpPageInput('');
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-stone-50/70 border-t border-stone-200/80 text-xs text-stone-600 select-none ${className}`}
    >
      {/* 1. THỐNG KÊ BẢN GHI & SỐ DÒNG/TRANG */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-1.5 font-medium">
          <span>Hiển thị</span>
          <span className="font-semibold text-stone-900 font-mono">
            {startItem.toLocaleString('vi-VN')} - {endItem.toLocaleString('vi-VN')}
          </span>
          <span>trong tổng</span>
          <span className="font-bold text-amber-700 font-mono">
            {total.toLocaleString('vi-VN')}
          </span>
          <span className="text-stone-500">{itemLabel}</span>
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-stone-500 pl-2 border-l border-stone-200">
            <span className="hidden md:inline text-[11px]">Dòng/trang:</span>
            <select
              value={size}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white border border-stone-300 hover:border-amber-500 focus:border-amber-600 rounded-lg px-2 py-1 text-xs font-semibold text-stone-800 shadow-2xs focus:outline-hidden transition-colors cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. CÁC NÚT ĐIỀU HƯỚNG TRANG */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
        {/* Nút về trang đầu tiên (Chỉ hiện khi > 2 trang) */}
        {totalPages > 3 && (
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            title="Về trang đầu tiên"
            className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95 text-stone-700 shadow-2xs"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        )}

        {/* Nút Trang Trước */}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95 text-stone-700 font-medium shadow-2xs text-[11px]"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Trước</span>
        </button>

        {/* Danh sách các số trang (Smart Ellipsis) */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((p, index) => {
            if (p === 'ellipsis-left' || p === 'ellipsis-right') {
              return (
                <span
                  key={`${p}-${index}`}
                  className="w-7 h-7 flex items-center justify-center text-stone-400 font-bold select-none text-xs"
                >
                  …
                </span>
              );
            }

            const isActive = p === page;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all active:scale-95 flex items-center justify-center font-mono ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs shadow-amber-500/30 ring-2 ring-amber-400/40 scale-105'
                    : 'bg-white border border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 text-stone-700 shadow-2xs'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Hiển thị tóm tắt trang trên Mobile */}
        <div className="sm:hidden px-2 font-mono text-xs font-semibold text-stone-800">
          {page} / {totalPages}
        </div>

        {/* Nút Trang Sau */}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95 text-stone-700 font-medium shadow-2xs text-[11px]"
        >
          <span className="hidden md:inline">Sau</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Nút đến trang cuối cùng */}
        {totalPages > 3 && (
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
            title="Đến trang cuối cùng"
            className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95 text-stone-700 shadow-2xs"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        )}

        {/* Ô nhảy nhanh đến trang (Jump To Page) - Chỉ hiện khi totalPages > 5 */}
        {totalPages > 5 && (
          <form
            onSubmit={handleJumpSubmit}
            className="hidden lg:flex items-center gap-1 pl-2 border-l border-stone-200"
          >
            <span className="text-[11px] text-stone-500">Đến:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              placeholder={`${page}`}
              className="w-11 px-1.5 py-1 bg-white border border-stone-300 rounded-lg text-center text-xs font-mono font-semibold text-stone-800 focus:outline-hidden focus:border-amber-600"
            />
            <button
              type="submit"
              disabled={!jumpPageInput}
              className="p-1 rounded-lg bg-stone-200 hover:bg-amber-600 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors text-stone-700 cursor-pointer"
              title="Nhảy đến trang"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
