import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Lazy-initialized S3 client
let s3ClientInstance: S3Client | null = null;
let s3Checked = false;
let s3IsConfigured = false;

function getS3Client(): S3Client | null {
  if (!s3Checked) {
    s3IsConfigured = !!(
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      process.env.S3_BUCKET_NAME
    );
    s3Checked = true;
  }
  
  if (!s3IsConfigured) {
    return null;
  }
  
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT, // For R2: https://<account_id>.r2.cloudflarestorage.com
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: true, // Required for some S3-compatible services
    });
  }
  
  return s3ClientInstance;
}

function getBucketName(): string {
  return process.env.S3_BUCKET_NAME || 'archi-documents';
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
}

/**
 * Check if S3 storage is available
 */
export function isStorageConfigured(): boolean {
  getS3Client(); // Trigger check
  return s3IsConfigured;
}

/**
 * Generate a structured key for organizing files
 * Structure: {tenantId}/{workspaceId}/{type}/{timestamp}-{randomId}-{filename}
 */
export function generateFileKey(
  tenantId: string, 
  fileName: string,
  options?: {
    workspaceId?: string;
    agentId?: string;
    type?: 'documents' | 'audio' | 'exports';
  }
): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100);
  const type = options?.type || 'documents';
  
  // Build path segments
  const segments = [tenantId];
  
  if (options?.workspaceId) {
    segments.push(`ws-${options.workspaceId}`);
  }
  
  if (options?.agentId) {
    segments.push(`agent-${options.agentId}`);
  }
  
  segments.push(type);
  segments.push(`${timestamp}-${randomId}-${sanitizedName}`);
  
  return segments.join('/');
}

/**
 * Upload a file to S3
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<UploadResult> {
  const s3Client = getS3Client();
  const BUCKET_NAME = getBucketName();
  
  // If S3 is not configured, store as base64 data URL (fallback for development)
  if (!s3Client) {
    console.warn('S3 not configured - using data URL fallback (not recommended for production)');
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;
    return {
      key,
      url: dataUrl,
      size: buffer.length,
    };
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  try {
    await s3Client.send(command);
  } catch (error: unknown) {
    const err = error as Error & { Code?: string };
    console.error('S3 Upload Error:', {
      error: err.message,
      code: err.Code,
      bucket: BUCKET_NAME,
      key,
    });
    throw new Error(`Failed to upload to S3: ${err.message || 'Access Denied'}. Please check your S3 credentials and bucket permissions.`);
  }

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
  const s3Client = getS3Client();
  const BUCKET_NAME = getBucketName();
  
  // If S3 is not configured, return empty string (data URL should be stored in DB)
  if (!s3Client) {
    return '';
  }

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
  const s3Client = getS3Client();
  const BUCKET_NAME = getBucketName();
  
  if (!s3Client) {
    console.warn('S3 not configured - skipping delete');
    return;
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Download a file from S3 as a Buffer
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const s3Client = getS3Client();
  const BUCKET_NAME = getBucketName();
  
  if (!s3Client) {
    throw new Error('S3 not configured');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);
  
  if (!response.Body) {
    throw new Error('No body in S3 response');
  }

  // Convert the readable stream to a buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Extract the S3 key from a stored URL
 * Handles both signed URLs and public URLs
 */
export function extractKeyFromUrl(url: string): string | null {
  if (!url) return null;
  
  // Handle data URLs (not S3)
  if (url.startsWith('data:')) return null;
  
  const BUCKET_NAME = getBucketName();
  try {
    const urlObj = new URL(url);
    // Remove leading slash from pathname
    let key = urlObj.pathname.replace(/^\//, '');
    
    // If it's an R2 URL, the bucket name might be in the path
    // Format: /bucket-name/path/to/file
    // We need just: path/to/file
    if (key.startsWith(BUCKET_NAME + '/')) {
      key = key.substring(BUCKET_NAME.length + 1);
    }
    
    return key || null;
  } catch {
    return null;
  }
}

/**
 * Upload audio file (for voice note replies)
 */
export async function uploadAudio(
  buffer: Buffer,
  tenantId: string,
  format: 'mp3' | 'ogg' = 'mp3',
  workspaceId?: string
): Promise<UploadResult> {
  const key = generateFileKey(tenantId, `voice-note.${format}`, {
    workspaceId,
    type: 'audio',
  });
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
  options?: {
    workspaceId?: string;
    agentId?: string;
    expiresIn?: number;
  }
): Promise<{ uploadUrl: string; key: string }> {
  const s3Client = getS3Client();
  const BUCKET_NAME = getBucketName();
  
  if (!s3Client) {
    throw new Error('S3 storage not configured');
  }

  const key = generateFileKey(tenantId, fileName, {
    workspaceId: options?.workspaceId,
    agentId: options?.agentId,
    type: 'documents',
  });

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: options?.expiresIn || 3600 });

  return { uploadUrl, key };
}

// Export getter functions instead of direct clients
export { getS3Client, getBucketName };
