import type { StorageProvider } from "@/lib/storage/types";
import { S3StorageProvider } from "@/lib/storage/s3";
import { SupabaseStorageProvider } from "@/lib/storage/supabase";

/**
 * Resolve the configured storage provider (design §8). Swappable via
 * STORAGE_PROVIDER env var without changing call sites.
 */
let cached: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (cached) return cached;
  const provider = process.env.STORAGE_PROVIDER ?? "s3";
  cached = provider === "supabase" ? new SupabaseStorageProvider() : new S3StorageProvider();
  return cached;
}

export type { StorageProvider } from "@/lib/storage/types";
