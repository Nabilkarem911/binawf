/**
 * Storage provider abstraction.
 *
 * Lets the app swap between local disk, S3, Supabase, Cloudinary, etc. via
 * the `STORAGE_PROVIDER` environment variable without touching call sites.
 * Implemented with built-in Node.js modules only (no external deps).
 */

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export interface UploadResult {
  /** Public-facing URL (or API route) used to retrieve the file. */
  url: string;
  /** Stored filename (unique, sanitized). */
  filename: string;
}

export interface StorageProvider {
  /** Persist a file and return its public URL plus stored filename. */
  upload(
    file: Buffer,
    filename: string,
    mimeType: string
  ): Promise<UploadResult>;
  /** Remove a previously stored file by its filename. */
  delete(filename: string): Promise<void>;
  /** Read a stored file's bytes by its filename. */
  read(filename: string): Promise<Buffer>;
}

// ---------------------------------------------------------------------------
// LocalStorageProvider
// ---------------------------------------------------------------------------

/**
 * Stores files on the local filesystem under `public/uploads` and serves them
 * through the `/api/media?filename=xxx` route so the raw upload directory is
 * never directly exposed.
 */
export class LocalStorageProvider implements StorageProvider {
  private readonly uploadDir: string;

  constructor(uploadDir?: string) {
    this.uploadDir = uploadDir ?? path.join(process.cwd(), "public", "uploads");
  }

  async upload(
    file: Buffer,
    filename: string,
    _mimeType: string
  ): Promise<UploadResult> {
    const safe = this.safeFilename(filename);
    const unique = this.uniqueName(safe);
    const target = this.resolveSafe(unique);

    await fs.mkdir(this.uploadDir, { recursive: true });
    await fs.writeFile(target, file);

    return {
      url: `/api/media?filename=${encodeURIComponent(unique)}`,
      filename: unique,
    };
  }

  async delete(filename: string): Promise<void> {
    const target = this.resolveSafe(filename);
    try {
      await fs.unlink(target);
    } catch (err: unknown) {
      // Idempotent: missing files are not an error.
      if (err instanceof Error && "code" in err && err.code === "ENOENT") {
        return;
      }
      throw err;
    }
  }

  async read(filename: string): Promise<Buffer> {
    const target = this.resolveSafe(filename);
    return fs.readFile(target);
  }

  // -----------------------------------------------------------------------
  // Path safety helpers
  // -----------------------------------------------------------------------

  /**
   * Resolve a filename to an absolute path inside the upload directory while
   * guarding against path traversal (e.g. `../secret`). Throws if the
   * resolved path escapes the upload directory.
   */
  private resolveSafe(filename: string): string {
    const base = path.resolve(this.uploadDir);
    // Strip any directory components from the incoming filename so a caller
    // cannot reference files outside the upload folder.
    const basename = path.basename(filename);
    if (!basename || basename === "." || basename === "..") {
      throw new Error("Invalid filename");
    }
    const resolved = path.resolve(base, basename);
    // Double-check the resolved path is still within the upload directory.
    const relative = path.relative(base, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("Path traversal detected");
    }
    return resolved;
  }

  /** Strip dangerous characters and keep a sane extension. */
  private safeFilename(filename: string): string {
    const basename = path.basename(filename || "file");
    // Replace anything that isn't alphanumeric, dash, underscore, or dot.
    const cleaned = basename.replace(/[^a-zA-Z0-9._-]/g, "-");
    // Collapse runs of dashes and trim leading/trailing dashes/dots.
    return cleaned.replace(/-{2,}/g, "-").replace(/^[-.]+|[-.]+$/g, "") || "file";
  }

  /** Append a short random suffix to avoid collisions. */
  private uniqueName(filename: string): string {
    const ext = path.extname(filename);
    const stem = path.basename(filename, ext);
    const id = crypto.randomBytes(8).toString("hex");
    return `${stem}-${id}${ext}`;
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Return the configured storage provider based on `STORAGE_PROVIDER`.
 * Defaults to local filesystem storage.
 */
export function getStorageProvider(): StorageProvider {
  const provider = (process.env.STORAGE_PROVIDER ?? "local").toLowerCase();
  switch (provider) {
    case "local":
    case "":
      return new LocalStorageProvider();
    case "s3":
      throw new Error(
        'Storage provider "s3" is not yet implemented. Set STORAGE_PROVIDER="local" or implement an S3 provider.'
      );
    case "supabase":
      throw new Error(
        'Storage provider "supabase" is not yet implemented. Set STORAGE_PROVIDER="local" or implement a Supabase provider.'
      );
    case "cloudinary":
      throw new Error(
        'Storage provider "cloudinary" is not yet implemented. Set STORAGE_PROVIDER="local" or implement a Cloudinary provider.'
      );
    default:
      throw new Error(
        `Unknown storage provider "${provider}". Supported values: local, s3, supabase, cloudinary.`
      );
  }
}
