import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

import { env } from './env';

const UPLOAD_DIR = path.resolve(process.cwd(), 'data/uploads');

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

export function generateStorageKey(buffer: Buffer, ext: string): string {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16);
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}/${month}/${hash}${ext}`;
}

export async function uploadFile(buffer: Buffer, key: string, mimeType: string): Promise<void> {
  if (env.STORAGE_DRIVER === 'local') {
    const filePath = path.join(UPLOAD_DIR, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
  } else {
    const client = getS3Client();
    await client.send(new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }));
  }
}

export function getPublicUrl(key: string | null): string | null {
  if (!key) return null;
  if (env.STORAGE_DRIVER === 'local') {
    return `/uploads/${key}`;
  }
  return `https://${env.R2_BUCKET_NAME}.r2.dev/${key}`;
}

export async function deleteFile(key: string): Promise<void> {
  if (env.STORAGE_DRIVER === 'local') {
    const filePath = path.join(UPLOAD_DIR, key);
    await fs.unlink(filePath).catch(() => {});
  } else {
    const client = getS3Client();
    await client.send(new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME!,
      Key: key,
    }));
  }
}
