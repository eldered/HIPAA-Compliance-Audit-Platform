import type { StorageProvider, StoredObject } from "@/lib/storage/types";

/**
 * Supabase Storage implementation using the storage REST API directly (no
 * @supabase/supabase-js dependency required). Uses the service-role key, so
 * this must only run server-side.
 */
export class SupabaseStorageProvider implements StorageProvider {
  private baseUrl: string;
  private serviceKey: string;
  private bucket: string;

  constructor() {
    this.baseUrl = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
    this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    this.bucket = process.env.STORAGE_BUCKET ?? "vivaudit-documents";
  }

  private headers(extra: Record<string, string> = {}) {
    return {
      Authorization: `Bearer ${this.serviceKey}`,
      apikey: this.serviceKey,
      ...extra,
    };
  }

  async upload(params: {
    key: string;
    body: Buffer | Uint8Array;
    contentType: string;
  }): Promise<StoredObject> {
    const res = await fetch(`${this.baseUrl}/storage/v1/object/${this.bucket}/${params.key}`, {
      method: "POST",
      headers: this.headers({ "Content-Type": params.contentType, "x-upsert": "true" }),
      body: Buffer.from(params.body),
    });
    if (!res.ok) throw new Error(`Supabase upload failed: ${res.status} ${await res.text()}`);
    return {
      key: params.key,
      url: `${this.baseUrl}/storage/v1/object/${this.bucket}/${params.key}`,
    };
  }

  async getSignedUrl(key: string, expiresInSeconds = 900): Promise<string> {
    const res = await fetch(`${this.baseUrl}/storage/v1/object/sign/${this.bucket}/${key}`, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    });
    if (!res.ok) throw new Error(`Supabase sign failed: ${res.status}`);
    const data = (await res.json()) as { signedURL: string };
    return `${this.baseUrl}/storage/v1${data.signedURL}`;
  }

  async download(key: string): Promise<Buffer> {
    const res = await fetch(`${this.baseUrl}/storage/v1/object/${this.bucket}/${key}`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`Supabase download failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/storage/v1/object/${this.bucket}/${key}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`Supabase delete failed: ${res.status}`);
  }
}
