import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "us-east-2";
export const S3_BUCKET = process.env.AWS_S3_BUCKET!;
export const S3_BASE_URL =
  process.env.NEXT_PUBLIC_S3_BASE_URL ||
  `https://${S3_BUCKET}.s3.${region}.amazonaws.com`;

export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadBufferToS3(params: {
  buffer: Buffer;
  key: string;
  contentType: string;
}): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: params.key,
      Body: params.buffer,
      ContentType: params.contentType,
    })
  );

  return `${S3_BASE_URL}/${params.key}`;
}

export async function createPresignedUploadUrl(params: {
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<{ uploadUrl: string; fileUrl: string }> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: params.key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: params.expiresIn ?? 300,
  });

  return {
    uploadUrl,
    fileUrl: `${S3_BASE_URL}/${params.key}`,
  };
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })
  );
}
