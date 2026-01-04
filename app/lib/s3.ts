import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client - works with AWS S3, Cloudflare R2, or any S3-compatible storage
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT, // For R2: https://<account_id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'archi-documents';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
}

/**
 * Generate a unique key for a file
 */
export function generateFileKey(tenantId: string, fileName: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `tenants/${tenantId}/documents/${timestamp}-${randomId}-${sanitizedName}`;
}

/**
 * Upload a file to S3
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<UploadResult> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Generate the URL (either public or signed)
  const url = await getFileUrl(key);

  return {
    key,
    url,
    size: buffer.length,
  };
}

/**
 * Get a signed URL for a file (expires in 1 hour by default)
 */
export async function getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  // If using public bucket, return direct URL
  if (process.env.S3_PUBLIC_URL) {
    return `${process.env.S3_PUBLIC_URL}/${key}`;
  }

  // Otherwise, generate signed URL
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Upload audio file (for voice note replies)
 */
export async function uploadAudio(
  buffer: Buffer,
  tenantId: string,
  format: 'mp3' | 'ogg' = 'mp3'
): Promise<UploadResult> {
  const timestamp = Date.now();
  const key = `tenants/${tenantId}/audio/${timestamp}.${format}`;
  const contentType = format === 'mp3' ? 'audio/mpeg' : 'audio/ogg';

  return uploadFile(buffer, key, contentType);
}

/**
 * Generate a presigned upload URL (for client-side uploads)
 */
export async function getPresignedUploadUrl(
  tenantId: string,
  fileName: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<{ uploadUrl: string; key: string }> {
  const key = generateFileKey(tenantId, fileName);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  return { uploadUrl, key };
}

export { s3Client, BUCKET_NAME };
