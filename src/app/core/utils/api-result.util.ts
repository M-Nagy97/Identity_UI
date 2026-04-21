export interface ApiEnvelope<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
}

export function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  const e = res as ApiEnvelope<T[]>;
  if (e?.data !== undefined && Array.isArray(e.data)) return e.data;
  return [];
}

export function unwrapMutation<T>(res: unknown): T {
  const e = res as ApiEnvelope<T>;
  if (e?.success === false) {
    throw new Error(e.message || 'Operation failed');
  }
  return e?.data as T;
}
