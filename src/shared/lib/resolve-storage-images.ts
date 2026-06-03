import { publicStorageUrl } from "@/shared/lib/public-storage-url";

export type StorageImageRow = {
  id: string;
  storage_path: string;
  alt_text?: string | null;
  is_primary?: boolean;
  sort_order?: number;
};

export type ResolvedImage = {
  id: string;
  url: string;
  alt: string | null;
};

export function resolveStorageImages(
  bucket: string,
  rows: StorageImageRow[],
  fallbackUrl?: string | null,
): ResolvedImage[] {
  const sorted = [...rows].sort((a, b) => {
    const ap = a.is_primary ? 1 : 0;
    const bp = b.is_primary ? 1 : 0;
    if (bp !== ap) return bp - ap;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  const resolved = sorted.map((row) => ({
    id: row.id,
    url: publicStorageUrl(bucket, row.storage_path),
    alt: row.alt_text ?? null,
  }));

  if (resolved.length === 0 && fallbackUrl?.trim()) {
    return [{ id: "legacy", url: fallbackUrl.trim(), alt: null }];
  }

  return resolved;
}
