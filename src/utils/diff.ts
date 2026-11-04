/**
 * Tiện ích so sánh sai khác (Diff) giữa dữ liệu gốc và dữ liệu form cập nhật.
 * Chỉ gửi lên Backend các trường thực sự thay đổi kèm theo `version` hiện tại
 * để thực hiện Optimistic Concurrency Control (OCC).
 */

export function getDiff<T extends Record<string, any>>(
  original: T,
  current: Record<string, any>,
  options?: {
    ignoredKeys?: string[];
  }
): Partial<T> & { version?: number } {
  const ignored = new Set(options?.ignoredKeys ?? ['id', '_id', 'createdAt', 'updatedAt', 'version']);
  const diff: Record<string, any> = {};

  const allKeys = new Set([...Object.keys(original || {}), ...Object.keys(current || {})]);

  for (const key of allKeys) {
    if (ignored.has(key)) continue;

    const originalVal = original ? original[key] : undefined;
    const currentVal = current ? current[key] : undefined;

    // So sánh đối tượng hoặc mảng qua JSON stringify
    const isDifferent =
      (typeof originalVal === 'object' && originalVal !== null) ||
      (typeof currentVal === 'object' && currentVal !== null)
        ? JSON.stringify(originalVal) !== JSON.stringify(currentVal)
        : originalVal !== currentVal;

    if (isDifferent) {
      diff[key] = currentVal;
    }
  }

  // Đính kèm version từ bản ghi gốc để Backend thực hiện Optimistic Locking
  if (original && original.version !== undefined) {
    diff.version = original.version;
  }

  return diff as Partial<T> & { version?: number };
}

/**
 * Kiểm tra xem một đối tượng diff có chứa ít nhất 1 trường thay đổi thực sự
 * (loại trừ trường `version`) hay không.
 */
export function hasChanges(diff: Record<string, any>): boolean {
  return Object.keys(diff).some((k) => k !== 'version');
}

/**
 * Nhận diện lỗi xung đột phiên bản (Optimistic Concurrency Conflict - HTTP 409 / VERSION_MISMATCH)
 */
export function isVersionMismatchError(error: any): boolean {
  if (!error) return false;
  return (
    error.status === 409 ||
    error.response?.status === 409 ||
    error.code === 'VERSION_MISMATCH' ||
    error.response?.data?.code === 'VERSION_MISMATCH' ||
    (typeof error.message === 'string' && error.message.toLowerCase().includes('phiên bản')) ||
    (typeof error.response?.data?.message === 'string' &&
      error.response.data.message.toLowerCase().includes('phiên bản'))
  );
}
