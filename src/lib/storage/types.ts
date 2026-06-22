/** Result of storing an object. */
export interface StoredObject {
  /** Provider-specific key/path used to reference the object later. */
  key: string;
  /** A URL the application can persist (may be a base URL; downloads use signed URLs). */
  url: string;
}

/** Abstraction over object storage (S3 / Supabase). */
export interface StorageProvider {
  /** Upload bytes and return its key + url. */
  upload(params: {
    key: string;
    body: Buffer | Uint8Array;
    contentType: string;
  }): Promise<StoredObject>;

  /** Return a time-limited signed URL for downloading an object. */
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;

  /** Fetch raw bytes for an object (used by the audit engine for text extraction). */
  download(key: string): Promise<Buffer>;

  /** Permanently delete an object. */
  delete(key: string): Promise<void>;
}
